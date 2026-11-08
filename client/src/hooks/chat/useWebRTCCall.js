import { useCallback, useEffect, useRef, useState } from "react";
import { fetchIceServers, fetchIncomingCall, sendCallSignal } from "../../api/chatApi.js";
import { isCallSupported } from "../../utils/callCapabilities.js";

/**
 * Grade connection quality from WebRTC stats into signal bars.
 * Returns 0 (unknown, no stats yet) through 4 (excellent).
 * When both metrics are present the worse one wins.
 */
export function gradeCallQuality(rttMs, lossPct) {
  const grades = [];
  if (Number.isFinite(rttMs)) {
    grades.push(rttMs < 100 ? 4 : rttMs < 200 ? 3 : rttMs < 400 ? 2 : 1);
  }
  if (Number.isFinite(lossPct)) {
    grades.push(lossPct < 1 ? 4 : lossPct < 3 ? 3 : lossPct < 8 ? 2 : 1);
  }
  if (grades.length === 0) return 0;
  return Math.min(...grades);
}

const UNKNOWN_QUALITY = { level: 0, rttMs: null, packetLossPct: null };
export const CALL_END_NOTICE_MS = 1750;
export const CALL_EXIT_MS = 250;

/**
 * Capture the local media stream for a call. A video request fails on
 * camera-less devices (NotFoundError) or when the camera is otherwise
 * unusable; fall back to an audio-only call.
 */
export async function acquireLocalMedia(wantsVideo) {
  const audioConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints,
      video: wantsVideo ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    return { stream, hasVideo: wantsVideo };
  } catch (err) {
    if (!wantsVideo) throw err;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    return { stream, hasVideo: false };
  }
}

/**
 * Call states: idle | calling | ringing | connected
 */
export function useWebRTCCall({ realtimeSenderRef } = {}) {
  const [callState, setCallState] = useState("idle");
  // Set while the call is winding down so the screen can show why it ended
  // (declined | ended | failed) before dropping out.
  const [callEndReason, setCallEndReason] = useState(null);
  const [isCallClosing, setIsCallClosing] = useState(false);
  const [callType, setCallType] = useState("voice"); // voice | video
  const [callChatId, setCallChatId] = useState(null);
  const [callPeer, setCallPeer] = useState(null); // { username, nickname, avatar }
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  // True when the local device has no usable camera.
  const [isCameraUnavailable, setIsCameraUnavailable] = useState(false);
  const [isRemoteCameraOff, setIsRemoteCameraOff] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user");
  const [backgroundEffect, setBackgroundEffect] = useState("none"); // "none" | "blur" | "deep-blur" | "image"
  const [isBgProcessing, setIsBgProcessing] = useState(false);
  const [backgroundError, setBackgroundError] = useState(null);
  const bgPipelineRef = useRef(null);
  const rawVideoElementRef = useRef(null);
  const rawCameraTrackRef = useRef(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);
  const [remoteStreamTick, setRemoteStreamTick] = useState(0);
  const [callQuality, setCallQuality] = useState(UNKNOWN_QUALITY);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const durationTimerRef = useRef(null);
  const disconnectTimerRef = useRef(null);
  const endNoticeTimerRef = useRef(null);
  const endExitTimerRef = useRef(null);
  const callEndReasonRef = useRef(null);
  const iceServersRef = useRef([]);
  const pendingCandidatesRef = useRef([]);

  // Mirrors of state used inside stable callbacks so they never read stale values
  const callStateRef = useRef(callState);
  const callTypeRef = useRef(callType);
  const callChatIdRef = useRef(callChatId);
  const cameraUnavailableRef = useRef(false);

  useEffect(() => {
    cameraUnavailableRef.current = isCameraUnavailable;
  }, [isCameraUnavailable]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);

  useEffect(() => {
    callChatIdRef.current = callChatId;
  }, [callChatId]);

  // Outgoing signal sender: prefers WebSocket if open, falls back to POST /api/calls/:action
  const postSignal = useCallback(
    async (path, body = {}) => {
      if (realtimeSenderRef?.current) {
        try {
          const sent = realtimeSenderRef.current({
            action: "call_signal",
            signalType: path,
            chatId: body.chatId,
            data: body,
          });
          if (sent) return { ok: true };
        } catch (_) {}
      }
      return await sendCallSignal(path, body);
    },
    [realtimeSenderRef]
  );

  const getEffectiveIceServers = useCallback(() => {
    if (iceServersRef.current && iceServersRef.current.length > 0) {
      return iceServersRef.current;
    }
    return [
      {
        urls: [
          "stun:chat.mbb724.ir:3478",
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ];
  }, []);

  const ensureIceServers = useCallback(async () => {
    if (iceServersRef.current && iceServersRef.current.length > 0) {
      return iceServersRef.current;
    }
    try {
      const servers = await fetchIceServers();
      if (Array.isArray(servers) && servers.length > 0) {
        iceServersRef.current = servers;
        return servers;
      }
    } catch (_) {}
    const fallback = getEffectiveIceServers();
    iceServersRef.current = fallback;
    return fallback;
  }, [getEffectiveIceServers]);

  // Fetch ICE servers on mount and when call initiates
  useEffect(() => {
    let isCancelled = false;
    void fetchIceServers().then((servers) => {
      if (!isCancelled && Array.isArray(servers) && servers.length) {
        iceServersRef.current = servers;
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const clearEndTimers = useCallback(() => {
    if (endNoticeTimerRef.current) {
      clearTimeout(endNoticeTimerRef.current);
      endNoticeTimerRef.current = null;
    }
    if (endExitTimerRef.current) {
      clearTimeout(endExitTimerRef.current);
      endExitTimerRef.current = null;
    }
  }, []);

  const resetCallState = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    clearEndTimers();
    callEndReasonRef.current = null;
    setCallEndReason(null);

    if (bgPipelineRef.current) {
      bgPipelineRef.current.stop();
      bgPipelineRef.current = null;
    }
    if (rawVideoElementRef.current) {
      rawVideoElementRef.current.pause();
      rawVideoElementRef.current.srcObject = null;
      try { rawVideoElementRef.current.remove(); } catch (_) {}
      rawVideoElementRef.current = null;
    }
    if (rawCameraTrackRef.current) {
      try { rawCameraTrackRef.current.stop(); } catch (_) {}
      rawCameraTrackRef.current = null;
    }
    setBackgroundEffect("none");
    if (localStreamRef.current) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.muted = false;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (_) {}
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];
    cameraUnavailableRef.current = false;
    setCallQuality(UNKNOWN_QUALITY);
    setCallState("idle");
    callStateRef.current = "idle";
    setCallChatId(null);
    callChatIdRef.current = null;
    setCallPeer(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsCameraUnavailable(false);
    setIsRemoteCameraOff(true);
    setIsSpeakerOn(true);
    setIsCallClosing(false);
  }, [clearEndTimers]);

  // Fade the call screen out, then clear all call state.
  const beginCallExit = useCallback(() => {
    if (endExitTimerRef.current) return;
    if (endNoticeTimerRef.current) {
      clearTimeout(endNoticeTimerRef.current);
      endNoticeTimerRef.current = null;
    }
    setIsCallClosing(true);
    endExitTimerRef.current = setTimeout(resetCallState, CALL_EXIT_MS);
  }, [resetCallState]);

  // Show why the call ended for a few seconds before the screen goes away.
  const finishCall = useCallback(
    (reason) => {
      if (
        callStateRef.current === "idle" ||
        callEndReasonRef.current ||
        endExitTimerRef.current
      )
        return;
      callEndReasonRef.current = reason;
      setCallEndReason(reason);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      // Stop capturing immediately; the notice is purely visual.
      if (bgPipelineRef.current) {
        bgPipelineRef.current.stop();
        bgPipelineRef.current = null;
      }
      if (rawVideoElementRef.current) {
        rawVideoElementRef.current.pause();
        rawVideoElementRef.current.srcObject = null;
        try { rawVideoElementRef.current.remove(); } catch (_) {}
        rawVideoElementRef.current = null;
      }
      if (rawCameraTrackRef.current) {
        try { rawCameraTrackRef.current.stop(); } catch (_) {}
        rawCameraTrackRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) remoteAudioRef.current.muted = true;
      if (remoteVideoRef.current) remoteVideoRef.current.muted = true;
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.close();
        } catch (_) {}
        peerConnectionRef.current = null;
      }
      endNoticeTimerRef.current = setTimeout(beginCallExit, CALL_END_NOTICE_MS);
    },
    [beginCallExit],
  );

  // Media path broke locally: tell the peer/server the call is over too.
  const failCall = useCallback(() => {
    const chatId = callChatIdRef.current;
    finishCall("failed");
    if (chatId) void postSignal("end", { chatId });
  }, [finishCall, postSignal]);

  const createPeerConnection = useCallback(() => {
    const iceServers = getEffectiveIceServers();
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 2,
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && callChatIdRef.current) {
        void postSignal("ice-candidate", {
          chatId: callChatIdRef.current,
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      let stream = event.streams && event.streams[0];
      if (!stream) {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (event.track && !remoteStreamRef.current.getTracks().includes(event.track)) {
          remoteStreamRef.current.addTrack(event.track);
        }
        stream = remoteStreamRef.current;
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = stream;
        } else if (remoteStreamRef.current !== stream) {
          stream.getTracks().forEach((track) => {
            if (!remoteStreamRef.current.getTracks().includes(track)) {
              remoteStreamRef.current.addTrack(track);
            }
          });
        }
      }

      const activeStream = remoteStreamRef.current;
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== activeStream) {
        remoteVideoRef.current.srcObject = activeStream;
        remoteVideoRef.current.play?.().catch(() => {});
      }
      document.querySelectorAll("video[aria-label*='Remote video']").forEach((v) => {
        if (v.srcObject !== activeStream) {
          v.srcObject = activeStream;
          v.play?.().catch(() => {});
        }
      });
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== activeStream) {
        remoteAudioRef.current.srcObject = activeStream;
        remoteAudioRef.current.play?.().catch(() => {});
      }
      setRemoteStreamTick((t) => t + 1);
    };

    const handleConnected = () => {
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      setCallState("connected");
      callStateRef.current = "connected";
      if (!durationTimerRef.current) {
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        handleConnected();
      } else if (pc.connectionState === "disconnected") {
        // Transient ICE blips are common; only hang up if it persists.
        if (!disconnectTimerRef.current) {
          disconnectTimerRef.current = setTimeout(() => {
            disconnectTimerRef.current = null;
            failCall();
          }, 6000);
        }
      } else if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        failCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        handleConnected();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [postSignal, failCall, getEffectiveIceServers]);

  // Start a call (caller)
  const startCall = useCallback(
    async ({
      chatId,
      calleeUsername,
      calleeNickname,
      calleeAvatar,
      calleeColor,
      calleeVerified,
      calleeRole,
      type = "voice",
    }) => {
      const normalizedChatId = String(chatId || "").trim();
      if (!normalizedChatId || !calleeUsername) return;
      if (callStateRef.current !== "idle") return;
      if (!isCallSupported()) {
        console.warn("Calls are only supported over secure HTTPS connections");
        return;
      }

      clearEndTimers();
      callEndReasonRef.current = null;
      setCallEndReason(null);
      setIsCallClosing(false);
      setCallState("calling");
      callStateRef.current = "calling";
      setCallType(type);
      callTypeRef.current = type;
      // Voice calls start with camera off, video calls with camera on.
      setIsCameraOff(type !== "video");
      setIsRemoteCameraOff(type !== "video");
      setCallChatId(normalizedChatId);
      callChatIdRef.current = normalizedChatId;
      setCallPeer({
        username: calleeUsername,
        nickname: calleeNickname,
        avatar: calleeAvatar,
        color: calleeColor,
        verified: calleeVerified,
        role: calleeRole,
      });

      try {
        void ensureIceServers();
        const { stream: gotStream, hasVideo } = await acquireLocalMedia(
          type === "video",
        );
        localStreamRef.current = gotStream;
        const [camTrack] = gotStream.getVideoTracks();
        if (camTrack) {
          rawCameraTrackRef.current = camTrack;
        }
        // A video call started on a device without a usable camera joins
        // audio-only with the camera off.
        setIsCameraOff(!hasVideo);
        setIsCameraUnavailable(type === "video" && !hasVideo);
        if (localVideoRef.current && hasVideo) {
          localVideoRef.current.srcObject = gotStream;
          localVideoRef.current.play?.().catch(() => {});
        }
        if (hasVideo) {
          document.querySelectorAll("video[aria-label*='Local video']").forEach((v) => {
            if (v.srcObject !== gotStream) {
              v.srcObject = gotStream;
              v.play?.().catch(() => {});
            }
          });
        }

        const res = await postSignal("start", {
          chatId: normalizedChatId,
          type,
        });
        if (!res?.ok && !res?.call) {
          finishCall("failed");
        } else if (type === "video" && !hasVideo) {
          // A camera-less video caller joins audio-only.
          void postSignal("camera-state", {
            chatId: normalizedChatId,
            cameraOff: true,
          });
        }
      } catch (err) {
        console.error("Failed to start call:", err);
        finishCall("failed");
      }
    },
    [postSignal, finishCall, clearEndTimers, ensureIceServers]
  );

  // Associate media streams with the media elements once they mount or when a
  // new remote stream arrives.
  useEffect(() => {
    if (callState === "idle") return;
    if (localVideoRef.current && localStreamRef.current && localVideoRef.current.srcObject !== localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play?.().catch(() => {});
    }
    if (remoteStreamRef.current) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play?.().catch(() => {});
      }
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
        remoteAudioRef.current.play?.().catch(() => {});
      }
    }
  }, [callState, callType, remoteStreamTick]);

  // Speaker toggle flips mute on the remote audio element.
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOn;
    }
  }, [isSpeakerOn]);

  // Sample WebRTC stats while connected to derive signal bars from
  // round-trip time (ping) and packet loss. Resets when the call ends.
  useEffect(() => {
    if (callState !== "connected") return undefined;
    let cancelled = false;
    const sample = async () => {
      const pc = peerConnectionRef.current;
      if (!pc || typeof pc.getStats !== "function") return;
      try {
        const stats = await pc.getStats();
        let rttMs = null;
        let fallbackRttMs = null;
        let lost = 0;
        let received = 0;
        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            typeof report.currentRoundTripTime === "number"
          ) {
            const ms = report.currentRoundTripTime * 1000;
            if (report.nominated) {
              rttMs = ms;
            } else if (report.state === "succeeded" && fallbackRttMs == null) {
              fallbackRttMs = ms;
            }
          }
          if (report.type === "inbound-rtp" && report.isRemote !== true) {
            if (typeof report.packetsLost === "number") lost += report.packetsLost;
            if (typeof report.packetsReceived === "number")
              received += report.packetsReceived;
          }
        });
        if (rttMs == null) rttMs = fallbackRttMs;
        const total = lost + received;
        const packetLossPct = total > 0 ? (lost / total) * 100 : null;
        if (!cancelled) {
          setCallQuality({
            level: gradeCallQuality(rttMs, packetLossPct),
            rttMs,
            packetLossPct,
          });
        }
      } catch (_) {}
    };
    void sample();
    const interval = setInterval(sample, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [callState]);

  // Pre-warm MediaPipe AI segmenter in the background when video call connects
  useEffect(() => {
    if (callState === "connected" && callType === "video" && !isCameraOff) {
      import("../../utils/videoBackground.js")
        .then((m) => m.getSelfieSegmenter())
        .catch(() => {});
    }
  }, [callState, callType, isCameraOff]);

  // Accept incoming call (callee)
  const acceptCall = useCallback(async () => {
    const chatId = callChatIdRef.current;
    if (!chatId) return;

    if (!isCallSupported()) {
      finishCall("unsupported");
      void postSignal("reject", { chatId, reason: "unsupported" });
      return;
    }

    try {
      await ensureIceServers();
      const acceptedType = callTypeRef.current;
      const { stream, hasVideo } = await acquireLocalMedia(
        acceptedType === "video",
      );
      localStreamRef.current = stream;
      const [camTrack] = stream.getVideoTracks();
      if (camTrack) {
        rawCameraTrackRef.current = camTrack;
      }
      // Voice calls start with camera off; a video call without a usable
      // camera joins audio-only with the camera off.
      setIsCameraOff(!hasVideo);
      setIsCameraUnavailable(acceptedType === "video" && !hasVideo);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      if (!stream.getVideoTracks().length) {
        try {
          pc.addTransceiver("video", { direction: "recvonly" });
        } catch (_) {}
      }

      // Process queued candidates
      while (pendingCandidatesRef.current.length > 0) {
        const cand = pendingCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (_) {}
      }

      const res = await postSignal("accept", { chatId });
      if (res === null) {
        finishCall("failed");
        return;
      }
      if (acceptedType === "video" && !hasVideo) {
        // A video call accepted without a usable camera joins audio-only;
        // tell the caller so its screen drops the empty video stage.
        void postSignal("camera-state", { chatId, cameraOff: true });
      }

      // Move out of "ringing" immediately.
      setCallState("connected");
      callStateRef.current = "connected";
      if (!durationTimerRef.current) {
        durationTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to accept call:", err);
      finishCall("failed");
      await postSignal("reject", { chatId });
    }
  }, [createPeerConnection, postSignal, finishCall, ensureIceServers]);

  // Reject incoming call (callee)
  const rejectCall = useCallback(async () => {
    const chatId = callChatIdRef.current;
    beginCallExit();
    if (chatId) await postSignal("reject", { chatId });
  }, [postSignal, beginCallExit]);

  // End active call
  const endCall = useCallback(async () => {
    const chatId = callChatIdRef.current;
    beginCallExit();
    if (chatId) await postSignal("end", { chatId });
  }, [postSignal, beginCallExit]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, []);

  // Speaker toggle: browsers have no earpiece route, so this controls whether
  // the remote peer is audible through the remote media elements.
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) {
      if (cameraUnavailableRef.current) return;
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const [videoTrack] = videoStream.getVideoTracks();
        if (!videoTrack) return;
        rawCameraTrackRef.current = videoTrack;
        stream.addTrack(videoTrack);
        const pc = peerConnectionRef.current;
        if (pc && pc.signalingState !== "closed") {
          pc.addTrack(videoTrack, stream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await postSignal("offer", {
            chatId: callChatIdRef.current,
            sdp: offer,
          });
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallType("video");
        callTypeRef.current = "video";
        setIsCameraOff(false);
        void postSignal("camera-state", {
          chatId: callChatIdRef.current,
          cameraOff: false,
        });
      } catch (err) {
        console.error("Failed to enable camera:", err);
      }
      return;
    }
    const nextOff = videoTracks.every((track) => track.enabled);
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff(nextOff);
    if (nextOff === false) {
      setCallType("video");
      callTypeRef.current = "video";
    }
    void postSignal("camera-state", {
      chatId: callChatIdRef.current,
      cameraOff: nextOff,
    });
  }, [postSignal]);

  const flipCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    try {
      const constraints = {
        video: { facingMode: { ideal: nextFacingMode } },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      const [newTrack] = newStream.getVideoTracks();
      if (!newTrack) return;

      const [oldTrack] = stream.getVideoTracks();
      rawCameraTrackRef.current = newTrack;

      if (rawVideoElementRef.current) {
        rawVideoElementRef.current.srcObject = new MediaStream([newTrack]);
        void rawVideoElementRef.current.play().catch(() => {});
      }

      if (!bgPipelineRef.current) {
        if (oldTrack) {
          stream.removeTrack(oldTrack);
          oldTrack.stop();
        }
        stream.addTrack(newTrack);

        const pc = peerConnectionRef.current;
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(newTrack);
          }
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
      setFacingMode(nextFacingMode);
    } catch (err) {
      console.warn("Could not flip camera:", err);
    }
  }, [facingMode]);

  const toggleScreenShare = useCallback(async () => {
    const pc = peerConnectionRef.current;
    let stream = localStreamRef.current;
    if (!pc) return;

    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const [camTrack] = camStream.getVideoTracks();
        if (camTrack) {
          rawCameraTrackRef.current = camTrack;
          if (bgPipelineRef.current && rawVideoElementRef.current) {
            rawVideoElementRef.current.srcObject = new MediaStream([camTrack]);
            void rawVideoElementRef.current.play().catch(() => {});
          }
        }
        if (stream) {
          const [oldTrack] = stream.getVideoTracks();
          if (oldTrack) {
            stream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          if (camTrack) {
            stream.addTrack(camTrack);
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (sender) {
              await sender.replaceTrack(camTrack);
            }
          }
        }
      } catch (err) {
        console.warn("Could not revert to camera after screenshare:", err);
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("اشتراک صفحه در این مرورگر پشتیبانی نمیشود یا دسترسی محدود است.");
        return;
      }
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const [screenTrack] = displayStream.getVideoTracks();
      if (!screenTrack) return;

      screenTrackRef.current = screenTrack;
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        navigator.mediaDevices.getUserMedia({ video: true }).then((camStream) => {
          const [camTrack] = camStream.getVideoTracks();
          if (camTrack) {
            rawCameraTrackRef.current = camTrack;
          }
          if (localStreamRef.current) {
            const [oldTrack] = localStreamRef.current.getVideoTracks();
            if (oldTrack) {
              localStreamRef.current.removeTrack(oldTrack);
              oldTrack.stop();
            }
            if (camTrack) {
              localStreamRef.current.addTrack(camTrack);
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
              if (sender) sender.replaceTrack(camTrack);
            }
          }
        }).catch(() => {});
      };

      if (!stream) {
        stream = new MediaStream();
        localStreamRef.current = stream;
      }

      const [oldTrack] = stream.getVideoTracks();
      if (oldTrack) {
        stream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      stream.addTrack(screenTrack);

      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender) {
        await sender.replaceTrack(screenTrack);
      } else {
        pc.addTrack(screenTrack, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postSignal("offer", {
          chatId: callChatIdRef.current,
          sdp: offer,
        });
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setCallType("video");
      callTypeRef.current = "video";
      setIsScreenSharing(true);
      setIsCameraOff(false);
      void postSignal("camera-state", {
        chatId: callChatIdRef.current,
        cameraOff: false,
      });
    } catch (err) {
      console.warn("Screen sharing cancelled or failed:", err);
    }
  }, [isScreenSharing, postSignal]);

  const setVirtualBackground = useCallback(async (effect, customImage = null) => {
    const pc = peerConnectionRef.current;
    const stream = localStreamRef.current;
    if (!stream) return;

    let rawTrack = rawCameraTrackRef.current;
    if (!rawTrack || rawTrack.readyState === "ended") {
      const currentTracks = stream.getVideoTracks();
      const currentTrack = currentTracks[0];
      if (currentTrack && currentTrack.readyState !== "ended") {
        rawTrack = currentTrack;
        rawCameraTrackRef.current = rawTrack;
      }
    }

    if (effect === "none") {
      if (bgPipelineRef.current) {
        bgPipelineRef.current.stop();
        bgPipelineRef.current = null;
      }
      if (rawVideoElementRef.current) {
        rawVideoElementRef.current.pause();
        rawVideoElementRef.current.srcObject = null;
        try { rawVideoElementRef.current.remove(); } catch (_) {}
        rawVideoElementRef.current = null;
      }

      if (rawTrack && rawTrack.readyState !== "ended") {
        if (pc) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (sender) {
            await sender.replaceTrack(rawTrack);
          }
        }
        const restoredStream = new MediaStream([rawTrack, ...stream.getAudioTracks()]);
        localStreamRef.current = restoredStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = restoredStream;
          localVideoRef.current.play().catch(() => {});
        }
        if (typeof document !== "undefined") {
          const localVideos = document.querySelectorAll("video[aria-label^='Local video']");
          localVideos.forEach((v) => {
            v.srcObject = restoredStream;
            v.play?.().catch(() => {});
          });
        }
      }
      setBackgroundEffect("none");
      setBackgroundError(null);
      return true;
    }

    try {
      setIsBgProcessing(true);
      setBackgroundError(null);
      if (!rawTrack || rawTrack.readyState === "ended") {
        console.warn("No active camera track available for virtual background");
        setIsBgProcessing(false);
        return false;
      }

      const { createVirtualBackgroundPipeline, getSelfieSegmenter } = await import("../../utils/videoBackground.js");
      // Load the model before touching the camera track. If it fails, the call keeps its current video and effect.
      await getSelfieSegmenter();

      if (!rawVideoElementRef.current) {
        const rawVideo = document.createElement("video");
        rawVideo.autoplay = true;
        rawVideo.playsInline = true;
        rawVideo.muted = true;
        rawVideo.style.position = "fixed";
        rawVideo.style.top = "0px";
        rawVideo.style.left = "0px";
        rawVideo.style.width = "4px";
        rawVideo.style.height = "4px";
        rawVideo.style.opacity = "0.01";
        rawVideo.style.pointerEvents = "none";
        rawVideo.style.zIndex = "9999";
        document.body.appendChild(rawVideo);
        rawVideo.srcObject = new MediaStream([rawTrack]);
        await rawVideo.play().catch((err) => {
          console.warn("rawVideo play error:", err);
        });
        await new Promise((resolve) => {
          if (rawVideo.readyState >= 2 && rawVideo.videoWidth > 0) {
            resolve();
          } else {
            rawVideo.onloadedmetadata = () => resolve();
            setTimeout(resolve, 500);
          }
        });
        rawVideoElementRef.current = rawVideo;
      }

      if (!bgPipelineRef.current) {
        bgPipelineRef.current = createVirtualBackgroundPipeline(
          rawVideoElementRef.current,
          effect,
          customImage
        );
      } else {
        bgPipelineRef.current.setEffect(effect, customImage);
      }

      const [processedTrack] = bgPipelineRef.current.outputStream.getVideoTracks();
      if (!processedTrack) {
        setIsBgProcessing(false);
        return false;
      }

      const currentTracks = stream.getVideoTracks();
      currentTracks.forEach((t) => {
        if (t !== rawTrack && t !== processedTrack) {
          stream.removeTrack(t);
          try { t.stop(); } catch (_) {}
        }
      });
      if (currentTracks.includes(rawTrack)) {
        stream.removeTrack(rawTrack);
      }
      if (!stream.getVideoTracks().includes(processedTrack)) {
        stream.addTrack(processedTrack);
      }

      if (pc) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(processedTrack);
        }
      }

      // Re-create stream wrapper so all HTML5 video elements bind to the new processed track immediately!
      const newLocalStream = new MediaStream([processedTrack, ...stream.getAudioTracks()]);
      localStreamRef.current = newLocalStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newLocalStream;
        localVideoRef.current.play?.().catch(() => {});
      }
      if (typeof document !== "undefined") {
        const localVideos = document.querySelectorAll("video[aria-label^='Local video']");
        localVideos.forEach((v) => {
          v.srcObject = newLocalStream;
          v.play?.().catch(() => {});
        });
      }
      setBackgroundEffect(effect);
      return true;
    } catch (err) {
      console.warn("Failed to apply virtual background:", err);
      setBackgroundError("بارگذاری مدل مات‌سازی پس‌زمینه ناموفق بود. لطفاً دوباره تلاش کنید.");
      return false;
    } finally {
      setIsBgProcessing(false);
    }
  }, []);

  // Handle incoming signaling messages
  const handleSignal = useCallback(
    async (payload) => {
      if (!payload?.type) return;

      switch (payload.type) {
        case "call:incoming": {
          // Busy: reject second call if already active
          if (callStateRef.current !== "idle") {
            void postSignal("reject", { chatId: payload.chatId });
            return;
          }
          setCallState("ringing");
          callStateRef.current = "ringing";
          setCallType(payload.callType || "voice");
          callTypeRef.current = payload.callType || "voice";
          // Voice calls start with camera off, video calls with camera on.
          setIsCameraOff((payload.callType || "voice") !== "video");
          setIsRemoteCameraOff((payload.callType || "voice") !== "video");
          setCallChatId(String(payload.chatId));
          callChatIdRef.current = String(payload.chatId);
          setCallPeer({
            username: payload.caller?.username || payload.callerUsername,
            nickname: payload.caller?.nickname || payload.callerNickname,
            avatar: payload.caller?.avatarUrl || payload.callerAvatar,
            color: payload.caller?.color || payload.callerColor,
            verified: payload.caller?.verified ?? payload.callerVerified,
            role: payload.caller?.role || payload.callerRole,
          });
          break;
        }

        case "call:accepted": {
          if (
            callStateRef.current !== "calling" ||
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          try {
            await ensureIceServers();
            const pc = createPeerConnection();
            if (localStreamRef.current) {
              localStreamRef.current
                .getTracks()
                .forEach((track) => pc.addTrack(track, localStreamRef.current));
            }
            
            if (!localStreamRef.current?.getVideoTracks().length) {
              try {
                pc.addTransceiver("video", { direction: "recvonly" });
              } catch (_) {}
            }
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await postSignal("offer", {
              chatId: callChatIdRef.current,
              sdp: offer,
            });
          } catch (err) {
            console.error("Failed to create offer:", err);
            finishCall("failed");
          }
          break;
        }

        case "call:offer": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          const sdpOffer = payload.sdp || payload.offer;
          try {
            await ensureIceServers();
            let pc = peerConnectionRef.current;
            if (!pc) {
              pc = createPeerConnection();
              if (localStreamRef.current) {
                localStreamRef.current
                  .getTracks()
                  .forEach((track) =>
                    pc.addTrack(track, localStreamRef.current)
                  );
              }
              if (!localStreamRef.current?.getVideoTracks().length) {
                try {
                  pc.addTransceiver("video", { direction: "recvonly" });
                } catch (_) {}
              }
            }
            await pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));

            // Flush queued ICE candidates
            while (pendingCandidatesRef.current.length > 0) {
              const cand = pendingCandidatesRef.current.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (_) {}
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await postSignal("answer", {
              chatId: callChatIdRef.current,
              sdp: answer,
            });
          } catch (err) {
            console.error("Failed to handle offer:", err);
            finishCall("failed");
          }
          break;
        }

        case "call:answer": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          const sdpAnswer = payload.sdp || payload.answer;
          if (!sdpAnswer) break;
          try {
            const pc = peerConnectionRef.current;
            if (pc && pc.signalingState !== "closed") {
              await pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
              while (pendingCandidatesRef.current.length > 0) {
                const cand = pendingCandidatesRef.current.shift();
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(cand));
                } catch (_) {}
              }
              // Handshake done: move caller out of "calling".
              setCallState("connected");
              callStateRef.current = "connected";
              if (!durationTimerRef.current) {
                durationTimerRef.current = setInterval(() => {
                  setCallDuration((prev) => prev + 1);
                }, 1000);
              }
            }
          } catch (err) {
            console.error("Failed to handle answer:", err);
          }
          break;
        }

        case "call:ice-candidate": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          const cand = payload.candidate;
          if (!cand) return;
          const pc = peerConnectionRef.current;
          if (pc && pc.remoteDescription && pc.signalingState !== "closed") {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch {
              // candidate may be stale (e.g. after renegotiation); safe to drop
            }
          } else {
            pendingCandidatesRef.current.push(cand);
          }
          break;
        }

        case "call:camera-state": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          const remoteOff = payload.cameraOff !== false;
          setIsRemoteCameraOff(remoteOff);
          if (remoteOff === false) {
            setCallType("video");
            callTypeRef.current = "video";
          }
          break;
        }

        case "call:rejected": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          // "unsupported" means the peer could not take the call at all
          // (e.g. insecure HTTP instance), not a deliberate decline.
          finishCall(
            payload.reason === "unsupported" ? "failed" : "declined"
          );
          break;
        }

        case "call:ended": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) !== String(callChatIdRef.current)
          ) {
            return;
          }
          finishCall("ended");
          break;
        }

        case "call:error": {
          if (
            callChatIdRef.current &&
            String(payload.chatId) === String(callChatIdRef.current)
          ) {
            finishCall("failed");
          }
          break;
        }

        default:
          break;
      }
    },
    [createPeerConnection, postSignal, finishCall, ensureIceServers]
  );

  // Recover a call that started while this app was closed.
  useEffect(() => {
    let isCancelled = false;
    void fetchIncomingCall().then((payload) => {
      if (!isCancelled && payload?.call) {
        void handleSignal(payload.call);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [handleSignal]);

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      resetCallState();
    };
  }, [resetCallState]);

  return {
    callState,
    callEndReason,
    isCallClosing,
    callType,
    callChatId,
    callPeer,
    callDuration,
    callQuality,
    isMuted,
    isCameraOff,
    isCameraUnavailable,
    isRemoteCameraOff,
    isSpeakerOn,
    localVideoRef,
    remoteVideoRef,
    remoteAudioRef,
    localStreamRef,
    remoteStreamRef,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    flipCamera,
    toggleScreenShare,
    isScreenSharing,
    backgroundEffect,
    isBgProcessing,
    backgroundError,
    setVirtualBackground,
    handleSignal,
  };
}
