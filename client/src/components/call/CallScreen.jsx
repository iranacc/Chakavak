import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  Sparkles,
  ImageIcon,
  Chat,
  LayoutGrid,
  Lock,
  Maximize,
  Mic,
  MicOff,
  Minimize,
  MonitorUp,
  Phone,
  RotateCcw,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "../../icons/lucide.js";
import Avatar from "../common/Avatar.jsx";
import Tooltip from "../common/Tooltip.jsx";
import UserRoleBadge from "../common/UserRoleBadge.jsx";
import VerifiedBadge from "../common/VerifiedBadge.jsx";
import { getAvatarInitials } from "../../utils/avatarInitials.js";
import { hasPersian } from "../../utils/fontUtils.js";
import { useMobileViewport } from "../../hooks/chat/useMobileViewport.js";

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const SIGNAL_LEVELS = {
  1: { Icon: SignalZero, color: "text-red-400", name: "Bad" },
  2: { Icon: SignalLow, color: "text-yellow-400", name: "Medium" },
  3: { Icon: SignalMedium, color: "text-emerald-400", name: "Good" },
  4: { Icon: SignalHigh, color: "text-emerald-300", name: "Excellent" },
};

function SignalIndicator({ quality }) {
  const level = quality?.level ?? 0;
  const entry = SIGNAL_LEVELS[level];
  const parts = [];
  if (Number.isFinite(quality?.rttMs)) parts.push(`${Math.round(quality.rttMs)}ms ping`);
  if (Number.isFinite(quality?.packetLossPct))
    parts.push(`${quality.packetLossPct.toFixed(1)}% loss`);
  const label = entry
    ? `Connection ${entry.name.toLowerCase()}${parts.length ? ` — ${parts.join(", ")}` : ""}`
    : "Measuring connection…";
  return (
    <Tooltip label={label}>
      <span
        className="relative inline-flex -translate-y-[2px]"
        role="img"
        aria-label={entry ? `Connection: ${entry.name}` : "Connection: measuring"}
      >
        <SignalHigh size={22} className="text-white/20" />
        {entry ? (
          <span className="absolute inset-0 inline-flex" aria-hidden="true">
            <entry.Icon size={22} className={entry.color} />
          </span>
        ) : null}
      </span>
    </Tooltip>
  );
}

export const CallScreen = memo(function CallScreen({
  callState,
  callEndReason,
  isCallClosing,
  callType,
  callPeer,
  callDuration,
  callQuality,
  isMuted,
  isCameraOff,
  cameraUnavailable = false,
  isRemoteCameraOff,
  isSpeakerOn,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  localStreamRef: propLocalStreamRef,
  remoteStreamRef: propRemoteStreamRef,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onFlipCamera,
  onToggleScreenShare,
  isScreenSharing = false,
  onSetVirtualBackground = null,
  backgroundEffect = "none",
  isBgProcessing = false,
  backgroundError = null,
  minimized: controlledMinimized,
  onMinimizeChange,
}) {
  const [internalMinimized, setInternalMinimized] = useState(false);
  const minimized =
    controlledMinimized !== undefined ? controlledMinimized : internalMinimized;
  const setMinimized = useCallback(
    (val) => {
      setInternalMinimized(val);
      onMinimizeChange?.(val);
    },
    [onMinimizeChange],
  );

  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cornerPipPos, setCornerPipPos] = useState(null);
  const [isDraggingCornerPip, setIsDraggingCornerPip] = useState(false);
  const isDraggingCornerPipRef = useRef(false);
  const pipStageRef = useRef(null);
  const cornerPipBoxRef = useRef(null);
  const [restoredFromPip, setRestoredFromPip] = useState(false);
  const [pipOriginStyle, setPipOriginStyle] = useState(undefined);
  const [remoteAspect, setRemoteAspect] = useState(3 / 4);
  const [localAspect, setLocalAspect] = useState(3 / 4);
  const [isSwapped, setIsSwapped] = useState(false);
  const [layoutMode, setLayoutMode] = useState("pip"); // "pip" | "split"
  const [bgMenuOpen, setBgMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimerRef = useRef(null);

  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (callState === "connected") {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3800);
    }
  }, [callState]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, [callState, resetControlsTimeout]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);
  const { isMobileViewport } = useMobileViewport();
  const boxRef = useRef(null);
  const isDraggingRef = useRef(false);
  const internalRemoteStreamRef = useRef(null);
  const internalLocalStreamRef = useRef(null);
  const remoteStreamRef = propRemoteStreamRef || internalRemoteStreamRef;
  const localStreamRef = propLocalStreamRef || internalLocalStreamRef;

  const isVideo = callType === "video";
  const remoteCameraOff =
    isRemoteCameraOff === undefined ? !isVideo : isRemoteCameraOff;
  const localOn = !isCameraOff;
  const remoteOn = !remoteCameraOff;
  const isConnected = callState === "connected";
  const bothOn = isConnected && (localOn || remoteOn);
  const pipSizing =
    localAspect >= 1
      ? "w-[45%] max-w-44 md:w-80 md:max-w-80"
      : "w-[28%] max-w-32 md:w-52 md:max-w-52";
  const peerName = callPeer?.nickname || callPeer?.username || "Unknown";
  const peerInitials = getAvatarInitials(peerName);
  const peerColor = callPeer?.color || "#10b981";
  const peerVerified = Boolean(callPeer?.verified ?? callPeer?.user_verified);
  const peerRole = callPeer?.role || callPeer?.user_role || null;

  const isEnding = Boolean(callEndReason);
  const endLabel =
    callEndReason === "declined"
      ? "Call declined"
      : callEndReason === "unsupported"
        ? "Calls unsupported on device"
        : callEndReason === "failed"
          ? "Call failed"
          : "Call ended";

  // Reset minimized state and dragged position if call disconnects
  useEffect(() => {
    if (callState !== "connected" || isEnding) {
      setRestoredFromPip(false);
      setPipOriginStyle(undefined);
      setMinimized(false);
      setPosition(null);
      setCornerPipPos(null);
    }
  }, [callState, isEnding, setMinimized]);

  // Prevent body scroll only while call screen is in fullscreen mode
  useEffect(() => {
    if (minimized) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [minimized]);

  // Clamp and anchor dragged box to its corner on window resize
  useEffect(() => {
    if (!position) return;
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const CORNER_MARGIN = 24;
        const rect = boxRef.current?.getBoundingClientRect();
        const width = rect?.width ?? 176;
        const height = rect?.height ?? 235;
        const cornerRight = Math.max(
          CORNER_MARGIN,
          window.innerWidth - width - CORNER_MARGIN,
        );
        const cornerBottom = Math.max(
          CORNER_MARGIN,
          window.innerHeight - height - CORNER_MARGIN,
        );
        return {
          x: prev.x < window.innerWidth / 2 ? CORNER_MARGIN : cornerRight,
          y: prev.y < window.innerHeight / 2 ? CORNER_MARGIN : cornerBottom,
        };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  // Maintain active media stream references so switching between fullscreen
  // and floating PiP doesn't lose audio/video feeds.
  const trackVideoAspect = (node, set) => {
    const update = () => {
      if (node.videoWidth && node.videoHeight)
        set(node.videoWidth / node.videoHeight);
    };
    node.addEventListener("loadedmetadata", update);
    node.addEventListener("resize", update);
    update();
  };

  const handleRemoteVideoRef = (node) => {
    if (remoteVideoRef) {
      if (typeof remoteVideoRef === "function") {
        remoteVideoRef(node);
      } else {
        remoteVideoRef.current = node;
      }
    }
    if (node) {
      const activeStream =
        remoteStreamRef?.current ||
        (typeof remoteVideoRef === "object" && remoteVideoRef?.current?.srcObject);
      if (activeStream && node.srcObject !== activeStream) {
        node.srcObject = activeStream;
      }
      node.muted = true;
      node.play?.().catch(() => {});
      trackVideoAspect(node, setRemoteAspect);
    }
  };

  const handleRemoteAudioRef = (node) => {
    if (remoteAudioRef) {
      if (typeof remoteAudioRef === "function") {
        remoteAudioRef(node);
      } else {
        remoteAudioRef.current = node;
      }
    }
    if (node) {
      const activeStream =
        remoteStreamRef?.current ||
        (typeof remoteAudioRef === "object" && remoteAudioRef?.current?.srcObject);
      if (activeStream && node.srcObject !== activeStream) {
        node.srcObject = activeStream;
      }
      node.muted = !isSpeakerOn;
      node.play?.().catch(() => {});
    }
  };

  const handleLocalVideoRef = (node) => {
    if (localVideoRef) {
      if (typeof localVideoRef === "function") {
        localVideoRef(node);
      } else {
        localVideoRef.current = node;
      }
    }
    if (node) {
      const activeStream =
        localStreamRef?.current ||
        (typeof localVideoRef === "object" && localVideoRef?.current?.srcObject);
      if (activeStream && node.srcObject !== activeStream) {
        node.srcObject = activeStream;
      }
      node.play?.().catch(() => {});
      trackVideoAspect(node, setLocalAspect);
    }
  };

  useEffect(() => {
    const stream =
      localStreamRef?.current || localVideoRef?.current?.srcObject;
    if (stream) {
      const localVideos = document.querySelectorAll(
        "video[aria-label^='Local video']",
      );
      localVideos.forEach((v) => {
        if (v.srcObject !== stream) {
          v.srcObject = stream;
          v.play?.().catch(() => {});
        }
      });
    }
  }, [backgroundEffect, localStreamRef, localVideoRef, isCameraOff, callState]);

  useEffect(() => {
    const stream =
      remoteStreamRef?.current || remoteVideoRef?.current?.srcObject;
    if (stream) {
      const remoteVideos = document.querySelectorAll(
        "video[aria-label^='Remote video']",
      );
      remoteVideos.forEach((v) => {
        if (v.srcObject !== stream) {
          v.srcObject = stream;
          v.play?.().catch(() => {});
        }
      });
    }
  }, [remoteStreamRef, remoteVideoRef, isRemoteCameraOff, callState]);

  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = rect.left;
    const origY = rect.top;
    const rectWidth = rect.width;
    const rectHeight = rect.height;
    let moved = false;
    let currentX = origX;
    let currentY = origY;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (!moved && Math.hypot(dx, dy) > 4) {
        moved = true;
        isDraggingRef.current = true;
        setIsDragging(true);
      }
      if (moved) {
        const maxX = Math.max(0, window.innerWidth - rectWidth);
        const maxY = Math.max(0, window.innerHeight - rectHeight);
        currentX = Math.min(Math.max(0, origX + dx), maxX);
        currentY = Math.min(Math.max(0, origY + dy), maxY);
        setPosition({ x: currentX, y: currentY });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      if (moved) {
        setIsDragging(false);

        // Always snap to the nearest corner on release
        const CORNER_MARGIN = 24;
        const cornerLeft = CORNER_MARGIN;
        const cornerRight = Math.max(
          CORNER_MARGIN,
          window.innerWidth - rectWidth - CORNER_MARGIN,
        );
        const cornerTop = CORNER_MARGIN;
        const cornerBottom = Math.max(
          CORNER_MARGIN,
          window.innerHeight - rectHeight - CORNER_MARGIN,
        );

        const snapX =
          currentX + rectWidth / 2 < window.innerWidth / 2
            ? cornerLeft
            : cornerRight;
        const snapY =
          currentY + rectHeight / 2 < window.innerHeight / 2
            ? cornerTop
            : cornerBottom;

        setPosition({ x: snapX, y: snapY });

        setTimeout(() => {
          isDraggingRef.current = false;
        }, 50);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleBoxClick = () => {
    if (isDraggingRef.current) return;
    const box = boxRef.current;
    if (box) {
      const rect = box.getBoundingClientRect();
      const targetDeltaX = rect.left + rect.width / 2 - window.innerWidth / 2;
      const targetDeltaY = rect.top + rect.height / 2 - window.innerHeight / 2;
      setPipOriginStyle({
        "--pip-origin-x": `${targetDeltaX}px`,
        "--pip-origin-y": `${targetDeltaY}px`,
      });
    } else {
      setPipOriginStyle(undefined);
    }
    setRestoredFromPip(true);
    setMinimized(false);
  };

  const handleCornerPipPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const stage = pipStageRef.current;
    const box = cornerPipBoxRef.current;
    if (!stage || !box) return;

    const stageRect = stage.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();
    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const startBoxX = boxRect.left - stageRect.left;
    const startBoxY = boxRect.top - stageRect.top;
    const boxWidth = boxRect.width;
    const boxHeight = boxRect.height;
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;

    let moved = false;
    let currentX = startBoxX;
    let currentY = startBoxY;

    const onPointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - startPointerX;
      const dy = moveEvent.clientY - startPointerY;
      if (!moved && Math.hypot(dx, dy) > 5) {
        moved = true;
        isDraggingCornerPipRef.current = true;
        setIsDraggingCornerPip(true);
      }
      if (moved) {
        const PADDING = 12;
        const maxX = Math.max(0, stageWidth - boxWidth - PADDING);
        const maxY = Math.max(0, stageHeight - boxHeight - PADDING);
        currentX = Math.min(Math.max(PADDING, startBoxX + dx), maxX);
        currentY = Math.min(Math.max(PADDING, startBoxY + dy), maxY);
        setCornerPipPos({ x: currentX, y: currentY });
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (moved) {
        setIsDraggingCornerPip(false);
        const PADDING = 16;
        const maxX = Math.max(PADDING, stageWidth - boxWidth - PADDING);
        const maxY = Math.max(PADDING, stageHeight - boxHeight - PADDING);

        // Snap to nearest of the 4 corners:
        const snapX =
          currentX + boxWidth / 2 < stageWidth / 2 ? PADDING : maxX;
        const snapY =
          currentY + boxHeight / 2 < stageHeight / 2 ? PADDING : maxY;

        setCornerPipPos({ x: snapX, y: snapY });

        setTimeout(() => {
          isDraggingCornerPipRef.current = false;
        }, 80);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  // Re-clamp corner PiP position on window resize
  useEffect(() => {
    if (!cornerPipPos) return;
    const handleResize = () => {
      const stage = pipStageRef.current;
      const box = cornerPipBoxRef.current;
      if (!stage || !box) return;
      const stageRect = stage.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();
      const PADDING = 16;
      const maxX = Math.max(PADDING, stageRect.width - boxRect.width - PADDING);
      const maxY = Math.max(PADDING, stageRect.height - boxRect.height - PADDING);

      setCornerPipPos((prev) => {
        if (!prev) return null;
        const snapX =
          prev.x + boxRect.width / 2 < stageRect.width / 2 ? PADDING : maxX;
        const snapY =
          prev.y + boxRect.height / 2 < stageHeight / 2 ? PADDING : maxY;
        return { x: snapX, y: snapY };
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cornerPipPos]);

  const ringtoneRef = useRef(null);

  // Play ringtone and vibrate while calling / ringing, stop on connected / ending / unmount
  useEffect(() => {
    if (isEnding || (callState !== "calling" && callState !== "ringing")) {
      ringtoneRef.current?.pause();
      ringtoneRef.current = null;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(0); } catch (_) {}
      }
      return;
    }
    const audio = new Audio("/sounds/ringtone.mp3");
    audio.loop = true;
    ringtoneRef.current = audio;

    // Start playback and attach fallback gesture listeners if blocked by browser Autoplay policy
    audio.play().catch(() => {});

    const onUserInteraction = () => {
      audio.play().catch(() => {});
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };
    window.addEventListener("pointerdown", onUserInteraction, { once: true });
    window.addEventListener("keydown", onUserInteraction, { once: true });

    let vibrateTimer = null;
    if (callState === "ringing" && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([500, 250, 500, 250, 500, 250, 1000]);
        vibrateTimer = setInterval(() => {
          try { navigator.vibrate([500, 250, 500, 250, 500, 250, 1000]); } catch (_) {}
        }, 3500);
      } catch (_) {}
    }

    return () => {
      audio.pause();
      window.removeEventListener("pointerdown", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      if (vibrateTimer) clearInterval(vibrateTimer);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(0); } catch (_) {}
      }
      if (ringtoneRef.current === audio) ringtoneRef.current = null;
    };
  }, [callState, isEnding]);

  // Play hangup sound once when the call ends, declined or failed
  useEffect(() => {
    if (!isEnding) return;
    const audio = new Audio("/sounds/hangup.mp3");
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [isEnding]);

  const stateLabel = isEnding
    ? endLabel
    : callState === "calling"
      ? "Calling..."
      : callState === "ringing"
        ? "Incoming call"
        : callState === "connected"
          ? formatDuration(callDuration)
          : "";
  const stateLabelColor = isEnding ? "text-red-400" : "text-emerald-400";
  // Controls stay mounted while the end notice shows, but are inert.
  const controlState = isEnding
    ? "opacity-40 cursor-not-allowed"
    : "cursor-pointer";

  const btnBaseClass = "flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-all duration-200 shadow-md shrink-0";

  const endButton = (
    <button
      type="button"
      onClick={onEnd}
      disabled={isEnding}
      className={`flex h-13 w-13 sm:h-15 sm:w-15 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-500/40 transition hover:bg-red-400 active:scale-95 ${controlState}`}
      aria-label="End call"
    >
      <Phone size={24} className="rotate-[135deg]" />
    </button>
  );

  const mainControlsRow = (
    <div className="flex items-center justify-center gap-3 sm:gap-4 max-w-full px-2">
      {/* Microphone Mute */}
      <Tooltip label={isMuted ? "Unmute / وصل صدا" : "Mute / قطع صدا"}>
        <button
          type="button"
          onClick={onToggleMute}
          disabled={isEnding}
          className={`${btnBaseClass} ${controlState} ${
            isMuted
              ? "bg-white text-gray-800 shadow-white/20 active:scale-95"
              : "bg-white/15 text-white hover:bg-white/25 active:scale-95"
          }`}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
      </Tooltip>

      {/* Video Camera Toggle */}
      <Tooltip label={isCameraOff ? "روشن کردن دوربین" : "خاموش کردن دوربین"}>
        <button
          type="button"
          onClick={onToggleCamera}
          disabled={isEnding || cameraUnavailable}
          className={`${btnBaseClass} ${controlState} ${
            isCameraOff
              ? "bg-white text-gray-800 shadow-white/20 active:scale-95"
              : "bg-white/15 text-white hover:bg-white/25 active:scale-95"
          } ${cameraUnavailable ? "opacity-40 cursor-not-allowed" : ""}`}
          aria-disabled={cameraUnavailable || undefined}
          aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
        >
          {isCameraOff ? <VideoOff size={22} /> : <Video size={22} />}
        </button>
      </Tooltip>

      {/* Speaker Toggle */}
      <Tooltip label={isSpeakerOn ? "خاموش کردن بلندگو" : "روشن کردن بلندگو"}>
        <button
          type="button"
          onClick={onToggleSpeaker}
          disabled={isEnding}
          className={`${btnBaseClass} ${controlState} ${
            isSpeakerOn
              ? "bg-white/15 text-white hover:bg-white/25 active:scale-95"
              : "bg-white text-gray-800 shadow-white/20 active:scale-95"
          }`}
          aria-label={isSpeakerOn ? "Turn speaker off" : "Turn speaker on"}
        >
          {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
      </Tooltip>

      {/* Red End Call Button in same row or centered */}
      {endButton}
    </div>
  );

  const extraToolsRow = isConnected && isVideo ? (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 p-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 max-w-[95vw] flex-wrap">
      {/* Flip camera */}
      {!isCameraOff && onFlipCamera ? (
        <Tooltip label="چرخش دوربین / Flip camera">
          <button
            type="button"
            onClick={onFlipCamera}
            disabled={isEnding}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition active:scale-95"
            aria-label="Flip camera"
          >
            <RotateCcw size={18} />
          </button>
        </Tooltip>
      ) : null}

      {/* AI Background Effects */}
      {!isCameraOff && onSetVirtualBackground ? (
        <div className="relative">
          <Tooltip label="افکت پس‌زمینه (هوش مصنوعی)">
            <button
              type="button"
              onClick={() => setBgMenuOpen((prev) => !prev)}
              disabled={isEnding || isBgProcessing}
              className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition active:scale-95 ${
                isBgProcessing
                  ? "bg-amber-500 text-white animate-pulse"
                  : backgroundEffect !== "none"
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
              aria-label="Background effects"
            >
              <Sparkles size={18} className={isBgProcessing ? "animate-spin" : ""} />
            </button>
          </Tooltip>

          {bgMenuOpen ? (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-1.5 p-2.5 bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[200px] text-xs text-white">
              <span className="font-bold text-center text-white/70 pb-1 border-b border-white/10 flex items-center justify-center gap-1.5">
                {isBgProcessing ? "در حال آماده‌سازی..." : "افکت پس‌زمینه هوش مصنوعی"}
              </span>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onSetVirtualBackground("none");
                  if (ok !== false) setBgMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition ${
                  backgroundEffect === "none" ? "bg-emerald-500/30 text-emerald-300 font-bold" : "hover:bg-white/10"
                }`}
              >
                <span>🚫</span>
                <span>عادی (بدون افکت)</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onSetVirtualBackground("blur");
                  if (ok !== false) setBgMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition ${
                  backgroundEffect === "blur" ? "bg-emerald-500/30 text-emerald-300 font-bold" : "hover:bg-white/10"
                }`}
              >
                <span>✨</span>
                <span>مات ملایم (Slight Blur)</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await onSetVirtualBackground("deep-blur");
                  if (ok !== false) setBgMenuOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition ${
                  backgroundEffect === "deep-blur" ? "bg-emerald-500/30 text-emerald-300 font-bold" : "hover:bg-white/10"
                }`}
              >
                <span>🌫️</span>
                <span>مات شدید (Deep Blur)</span>
              </button>
              {backgroundError ? (
                <p role="alert" className="px-3 pt-1 text-[11px] leading-5 text-rose-300">{backgroundError}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Screen Sharing */}
      {onToggleScreenShare ? (
        <Tooltip label={isScreenSharing ? "توقف اشتراک صفحه" : "اشتراک صفحه نمایش"}>
          <button
            type="button"
            onClick={onToggleScreenShare}
            disabled={isEnding}
            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition active:scale-95 ${
              isScreenSharing
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
            aria-label="Share screen"
          >
            <MonitorUp size={18} />
          </button>
        </Tooltip>
      ) : null}

      {/* Layout Split/PiP Mode */}
      {bothOn ? (
        <Tooltip label={layoutMode === "split" ? "نمای تصویر در تصویر (PiP)" : "نمای نصف صفحه (Split)"}>
          <button
            type="button"
            onClick={() => setLayoutMode((prev) => (prev === "pip" ? "split" : "pip"))}
            disabled={isEnding}
            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition active:scale-95 ${
              layoutMode === "split"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
            aria-label="Toggle layout mode"
          >
            <LayoutGrid size={18} />
          </button>
        </Tooltip>
      ) : null}

      {/* Swap Cameras in PiP Mode */}
      {bothOn && layoutMode === "pip" ? (
        <Tooltip label="تغییر نمای دوربین‌ها / Swap cameras">
          <button
            type="button"
            onClick={() => setIsSwapped((prev) => !prev)}
            disabled={isEnding}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-white/90 hover:bg-white/20 transition active:scale-95"
            aria-label="Swap cameras"
          >
            <ArrowLeftRight size={18} />
          </button>
        </Tooltip>
      ) : null}
    </div>
  ) : null;

  return createPortal(
    minimized && !isEnding ? (
      <div
        ref={boxRef}
        data-testid="floating-call-box"
        role="button"
        tabIndex={0}
        aria-label="Return to call"
        title="Click to expand"
        onPointerDown={handlePointerDown}
        onClick={handleBoxClick}
        className={`fixed z-[9999] sb-pip-enter select-none touch-none ${
          remoteAspect >= 1 ? "w-48 sm:w-64" : "w-36 sm:w-44"
        } rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing ${
          isDragging
            ? "transition-none"
            : "transition-[left,top] duration-200 ease-out"
        } ${position ? "" : "top-6 right-6"}`}
        style={{
          aspectRatio: `${remoteAspect}`,
          ...(position ? { left: `${position.x}px`, top: `${position.y}px` } : {}),
        }}
      >
        {remoteOn ? (
          <video
            ref={handleRemoteVideoRef}
            autoPlay
            playsInline
            muted
            aria-label="Remote video"
            className="h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-3 select-none pointer-events-none">
            <Avatar
              src={callPeer?.avatar || ""}
              alt={peerName}
              name={peerName}
              color={peerColor}
              initials={peerInitials}
              className="h-16 w-16 text-xl shadow-lg"
            />
            <div className="mt-2 flex max-w-[90%] items-center justify-center gap-0.5 min-w-0">
              <span
                className={`truncate text-xs font-semibold text-white/90 ${
                  hasPersian(peerName) ? "font-fa sb-fa-baseline-fix" : ""
                }`}
                dir="auto"
              >
                {peerName}
              </span>
              {Boolean(peerVerified) && <VerifiedBadge size={13} />}
              <UserRoleBadge role={peerRole} size={13} />
            </div>
          </div>
        )}
        <audio ref={handleRemoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    ) : (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center ${
          isConnected ? "" : "md:bg-black/45 md:px-5"
        } ${restoredFromPip ? "sb-backdrop-enter" : ""} ${
          isCallClosing ? "sb-call-exit-backdrop" : ""
        }`}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Call"
          onMouseMove={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
          onClick={resetControlsTimeout}
          className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${
            isConnected
              ? "md:rounded-none"
              : "md:aspect-square md:h-auto md:w-[400px] md:rounded-3xl md:shadow-xl"
          } ${
            restoredFromPip ? "sb-call-modal-enter" : ""
          } ${isCallClosing ? "sb-call-exit" : ""}`}
          style={restoredFromPip ? pipOriginStyle : undefined}
        >
        <audio ref={handleRemoteAudioRef} autoPlay playsInline className="hidden" />

        {/* Secure badge - very top */}
        <div className="absolute inset-x-0 top-0 z-30 flex justify-center pt-4">
          <Tooltip label="Peer-to-peer encrypted">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
              <Lock size={12} />
              Secure
            </span>
          </Tooltip>
        </div>

        {/* Top section - peer info */}
        {callState === "connected" ? (
          <div
            className={`relative z-20 flex w-full shrink-0 items-center justify-between px-6 sm:px-12 pb-4 pt-12 transition-all duration-300 ${
              controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
            }`}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar
                src={callPeer?.avatar || ""}
                alt={peerName}
                name={peerName}
                color={peerColor}
                initials={peerInitials}
                className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 text-lg shadow-xl"
              />
              <div className="flex min-w-0 flex-col">
                <div className="flex min-w-0 items-center gap-0.5">
                  <h2
                    className={`truncate text-base sm:text-lg font-semibold text-white ${
                      hasPersian(peerName) ? "font-fa sb-fa-baseline-fix" : ""
                    }`}
                    dir="auto"
                  >
                    {peerName}
                  </h2>
                  {Boolean(peerVerified) && <VerifiedBadge size={16} />}
                  <UserRoleBadge role={peerRole} size={16} />
                </div>
                <p
                  className={`mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-medium ${stateLabelColor}`}
                >
                  {isEnding ? null : <SignalIndicator quality={callQuality} />}
                  {stateLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip label={isFullscreen ? "Exit fullscreen / خروج از تمام‌صفحه" : "Fullscreen / تمام‌صفحه"}>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/5 text-white/90 transition hover:bg-white/15 hover:text-white ${controlState}`}
                  aria-label="Toggle fullscreen"
                >
                  {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                </button>
              </Tooltip>
              <Tooltip label="Back to chats / بازگشت به پیام‌ها">
                <button
                  type="button"
                  onClick={() => {
                    setRestoredFromPip(false);
                    setPipOriginStyle(undefined);
                    setPosition(null);
      setCornerPipPos(null);
                    setMinimized(true);
                  }}
                  disabled={isEnding}
                  className={`flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/90 transition hover:bg-white/15 hover:text-white ${controlState}`}
                  aria-label="Chat"
                >
                  <Chat size={22} />
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
        <div className="relative z-20 flex shrink-0 flex-col items-center pt-14">
          <Avatar
            src={callPeer?.avatar || ""}
            alt={peerName}
            name={peerName}
            color={peerColor}
            initials={peerInitials}
            className="h-24 w-24 text-2xl shadow-xl"
          />
          <div className="mt-4 flex max-w-[20rem] items-center justify-center gap-0.5 px-4 min-w-0">
            <h2
              className={`max-w-[20rem] truncate text-xl font-semibold text-white ${
                hasPersian(peerName) ? "font-fa sb-fa-baseline-fix" : ""
              }`}
              dir="auto"
            >
              {peerName}
            </h2>
            {Boolean(peerVerified) && <VerifiedBadge size={18} />}
            <UserRoleBadge role={peerRole} size={18} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
            {isVideo ? <Video size={14} /> : <Phone size={14} />}
            {isVideo ? "Video call" : "Voice call"}
          </p>
          <p className={`mt-2 text-sm font-medium ${stateLabelColor}`}>
            {stateLabel}
          </p>
        </div>
      )}

      {/* Video stage */}
      {isConnected ? (
        layoutMode === "split" && bothOn ? (
          /* Split Screen Layout (50/50 side by side or stacked) */
          <div className="relative z-0 mx-2 min-h-0 w-[calc(100%-1rem)] flex-1 overflow-hidden rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-3 p-2">
            <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-white/15 flex items-center justify-center shadow-xl">
              <video
                ref={handleRemoteVideoRef}
                autoPlay
                playsInline
                muted
                aria-label="Remote video"
                className={remoteOn ? "h-full w-full object-contain" : "hidden"}
              />
              {!remoteOn && (
                <div className="flex flex-col items-center gap-2">
                  <Avatar
                    src={callPeer?.avatar || ""}
                    alt={peerName}
                    name={peerName}
                    color={peerColor}
                    initials={peerInitials}
                    className="h-20 w-20 text-xl shadow-xl"
                  />
                  <span className="text-xs text-white/60">دوربین خاموش است</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                {peerName}
              </div>
            </div>

            <div className="relative h-full w-full rounded-2xl overflow-hidden bg-slate-950/80 border border-white/15 flex items-center justify-center shadow-xl">
              <video
                ref={handleLocalVideoRef}
                autoPlay
                playsInline
                muted
                aria-label="Local video"
                className={localOn ? "h-full w-full object-contain" : "hidden"}
              />
              {!localOn && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-white/60">دوربین شما خاموش است</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md">
                شما • You
              </div>
            </div>
          </div>
        ) : (
          /* PiP Mode with Draggable Floating Thumbnail & Persistent Video Nodes */
          <div
            ref={pipStageRef}
            className="relative z-10 mx-2 min-h-0 w-[calc(100%-1rem)] flex-1 overflow-hidden rounded-2xl bg-black/40"
          >
            {/* Remote Video Container */}
            <div
              {...(isSwapped
                ? {
                    ref: cornerPipBoxRef,
                    onPointerDown: handleCornerPipPointerDown,
                    onClick: () => {
                      if (!isDraggingCornerPipRef.current) setIsSwapped(false);
                    },
                    role: "button",
                    tabIndex: 0,
                    "aria-label": "Remote video thumbnail (click to swap, drag to move)",
                    title: "برای جابجایی بکشید • کلیک برای تغییر نما",
                    style: {
                      aspectRatio: `${remoteAspect}`,
                      ...(cornerPipPos
                        ? { left: `${cornerPipPos.x}px`, top: `${cornerPipPos.y}px` }
                        : {}),
                    },
                    className: `${
                      cornerPipPos ? "absolute" : "absolute bottom-6 right-6"
                    } z-30 overflow-hidden rounded-2xl border-2 border-white/60 bg-slate-950 shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center pointer-events-auto ${
                      isDraggingCornerPip
                        ? "transition-none shadow-emerald-500/30 ring-2 ring-emerald-400"
                        : "transition-[left,top] duration-300 ease-out hover:border-emerald-400"
                    } ${pipSizing}`,
                  }
                : {
                    className:
                      "absolute inset-0 h-full w-full z-0 overflow-hidden flex items-center justify-center pointer-events-auto",
                  })}
            >
              <video
                key="remote-call-video"
                ref={handleRemoteVideoRef}
                autoPlay
                playsInline
                muted
                aria-label="Remote video"
                className={
                  remoteOn
                    ? (isSwapped
                        ? "h-full w-full object-cover pointer-events-none"
                        : "h-full w-full object-contain pointer-events-none")
                    : "hidden"
                }
              />
              {!remoteOn && (
                <div className="flex flex-col items-center justify-center gap-2 p-2 text-center pointer-events-none select-none">
                  <Avatar
                    src={callPeer?.avatar || ""}
                    alt={peerName}
                    name={peerName}
                    color={peerColor}
                    initials={peerInitials}
                    className={isSwapped ? "h-12 w-12 text-sm shadow-lg" : "h-24 w-24 text-2xl shadow-xl"}
                  />
                  <span className={isSwapped ? "text-[10px] text-white/60 line-clamp-1" : "text-xs text-white/60"}>
                    دوربین خاموش است
                  </span>
                </div>
              )}
              <div
                className={`absolute ${
                  isSwapped ? "bottom-2 left-2 px-2 py-0.5 text-[10px]" : "bottom-3 left-3 px-2.5 py-1 text-[11px]"
                } z-10 rounded-lg bg-slate-900/80 font-semibold text-white/90 backdrop-blur-md pointer-events-none select-none`}
              >
                {peerName}
              </div>
              {isSwapped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSwapped(false);
                  }}
                  className="absolute top-2.5 right-2.5 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/85 text-white/90 shadow-lg backdrop-blur-md border border-white/25 hover:bg-emerald-600 hover:text-white transition active:scale-90 cursor-pointer pointer-events-auto"
                  title="تغییر نمای دوربین‌ها / Swap"
                  aria-label="Swap view"
                >
                  <ArrowLeftRight size={13} />
                </button>
              )}
            </div>

            {/* Local Video Container */}
            <div
              {...(!isSwapped
                ? {
                    ref: cornerPipBoxRef,
                    onPointerDown: handleCornerPipPointerDown,
                    onClick: () => {
                      if (!isDraggingCornerPipRef.current) setIsSwapped(true);
                    },
                    role: "button",
                    tabIndex: 0,
                    "aria-label": "Local video thumbnail (click to swap, drag to move)",
                    title: "برای جابجایی بکشید • کلیک برای تغییر نما",
                    style: {
                      aspectRatio: `${localAspect}`,
                      ...(cornerPipPos
                        ? { left: `${cornerPipPos.x}px`, top: `${cornerPipPos.y}px` }
                        : {}),
                    },
                    className: `${
                      cornerPipPos ? "absolute" : "absolute bottom-6 right-6"
                    } z-30 overflow-hidden rounded-2xl border-2 border-white/60 bg-slate-950 shadow-2xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center pointer-events-auto ${
                      isDraggingCornerPip
                        ? "transition-none shadow-emerald-500/30 ring-2 ring-emerald-400"
                        : "transition-[left,top] duration-300 ease-out hover:border-emerald-400"
                    } ${pipSizing}`,
                  }
                : {
                    className:
                      "absolute inset-0 h-full w-full z-0 overflow-hidden flex items-center justify-center pointer-events-auto",
                  })}
            >
              <video
                key="local-call-video"
                ref={handleLocalVideoRef}
                autoPlay
                playsInline
                muted
                aria-label="Local video"
                className={
                  localOn
                    ? (!isSwapped
                        ? "h-full w-full object-cover pointer-events-none"
                        : "h-full w-full object-contain pointer-events-none")
                    : "hidden"
                }
              />
              {!localOn && (
                <div className="flex flex-col items-center justify-center gap-2 p-2 text-center pointer-events-none select-none">
                  <span className={!isSwapped ? "text-[10px] text-white/60 line-clamp-1" : "text-xs text-white/60"}>
                    دوربین شما خاموش است
                  </span>
                </div>
              )}
              <div
                className={`absolute ${
                  !isSwapped ? "bottom-2 left-2 px-2 py-0.5 text-[10px]" : "bottom-3 left-3 px-2.5 py-1 text-[11px]"
                } z-10 rounded-lg bg-slate-900/80 font-semibold text-white/90 backdrop-blur-md pointer-events-none select-none`}
              >
                شما • You
              </div>
              {!isSwapped && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSwapped(true);
                  }}
                  className="absolute top-2.5 right-2.5 z-40 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/85 text-white/90 shadow-lg backdrop-blur-md border border-white/25 hover:bg-emerald-600 hover:text-white transition active:scale-90 cursor-pointer pointer-events-auto"
                  title="تغییر نمای دوربین‌ها / Swap"
                  aria-label="Swap view"
                >
                  <ArrowLeftRight size={13} />
                </button>
              )}
            </div>
          </div>
        )
      ) : null}

      {/* Controls with Auto-hide */}
      <div
        className={`relative z-20 flex shrink-0 flex-col items-center gap-6 transition-all duration-300 ${
          callState === "connected" ? "pb-8 pt-6" : "pb-48 md:pb-12"
        } ${
          controlsVisible || callState !== "connected"
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Incoming call: accept + reject with wide gap */}
        {callState === "ringing" ? (
          <div className="flex items-center gap-24">
            <button
              type="button"
              onClick={onAccept}
              disabled={isEnding}
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 ${controlState}`}
              aria-label="Accept call"
            >
              <Phone size={26} />
            </button>
            <button
              type="button"
              onClick={onReject}
              disabled={isEnding}
              className={`flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-400 ${controlState}`}
              aria-label="Reject call"
            >
              <Phone size={26} className="rotate-[135deg]" />
            </button>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col items-center gap-3 w-full px-4">
            {extraToolsRow}
            {mainControlsRow}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {endButton}
          </div>
        )}
      </div>
      </div>
    </div>
    ),
    document.body,
  );
});
