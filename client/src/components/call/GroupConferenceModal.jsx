import { memo, useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  Phone,
  Maximize,
  Minimize,
  Users,
} from "../../icons/lucide.js";
import Avatar from "../common/Avatar.jsx";
import Tooltip from "../common/Tooltip.jsx";

function ParticipantTile({ participant, isLocal = false }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [videoTrack, setVideoTrack] = useState(null);
  const [audioTrack, setAudioTrack] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!participant) return;

    const updateTracks = () => {
      // Find camera video publication
      let vPub = null;
      let aPub = null;
      if (participant.videoTrackPublications) {
        participant.videoTrackPublications.forEach((pub) => {
          if (pub.track) vPub = pub.track;
        });
      }
      if (participant.audioTrackPublications) {
        participant.audioTrackPublications.forEach((pub) => {
          if (pub.track) aPub = pub.track;
        });
      }

      setVideoTrack(vPub);
      setAudioTrack(aPub);
      setIsSpeaking(Boolean(participant.isSpeaking));
    };

    updateTracks();

    participant.on("trackSubscribed", updateTracks);
    participant.on("trackUnsubscribed", updateTracks);
    participant.on("trackMuted", updateTracks);
    participant.on("trackUnmuted", updateTracks);
    participant.on("isSpeakingChanged", (speaking) => setIsSpeaking(speaking));

    return () => {
      participant.off("trackSubscribed", updateTracks);
      participant.off("trackUnsubscribed", updateTracks);
      participant.off("trackMuted", updateTracks);
      participant.off("trackUnmuted", updateTracks);
    };
  }, [participant]);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
      return () => {
        try {
          videoTrack.detach(videoRef.current);
        } catch (_) {}
      };
    }
  }, [videoTrack]);

  useEffect(() => {
    if (audioTrack && audioRef.current && !isLocal) {
      audioTrack.attach(audioRef.current);
      return () => {
        try {
          audioTrack.detach(audioRef.current);
        } catch (_) {}
      };
    }
  }, [audioTrack, isLocal]);

  const name = participant.name || participant.identity || (isLocal ? "شما (You)" : "کاربر");
  const hasVideo = Boolean(videoTrack && !videoTrack.isMuted);

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border transition-all duration-300 shadow-lg ${
        isSpeaking ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-white/10"
      }`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          hasVideo ? "opacity-100" : "hidden opacity-0"
        }`}
      />
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {!hasVideo && (
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <Avatar
            name={name}
            className="h-16 w-16 text-xl shadow-xl ring-2 ring-white/10"
          />
          <span className="text-xs font-medium text-white/70 max-w-[140px] truncate">
            {name}
          </span>
        </div>
      )}

      {/* Participant Name Badge & Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md border border-white/10 truncate max-w-[80%]">
          {isSpeaking && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          <span className="truncate">{name}</span>
          {isLocal && <span className="text-white/50 text-[10px]">(شما)</span>}
        </div>
      </div>
    </div>
  );
}

export const GroupConferenceModal = memo(function GroupConferenceModal({
  chatId,
  chatTitle,
  isOpen,
  onClose,
}) {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef(null);

  const resetControlsTimeout = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4500);
  }, []);

  const connectToConference = useCallback(async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      // 1. Fetch conference token
      const res = await fetch("/api/calls/conference-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) {
        throw new Error(data.error || "خطا در دریافت مجوز اتصال به جلسه");
      }

      // 2. Dynamically import livekit-client to keep initial bundle small
      const { Room, RoomEvent } = await import("livekit-client");
      const currentRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // 3. Setup event listeners
      const syncParticipants = () => {
        const remote = Array.from(currentRoom.remoteParticipants.values());
        setParticipants([...remote]);
      };

      currentRoom
        .on(RoomEvent.ParticipantConnected, syncParticipants)
        .on(RoomEvent.ParticipantDisconnected, syncParticipants)
        .on(RoomEvent.TrackSubscribed, syncParticipants)
        .on(RoomEvent.TrackUnsubscribed, syncParticipants)
        .on(RoomEvent.Disconnected, () => {
          onClose?.();
        });

      // 4. Connect to Room
      await currentRoom.connect(data.serverUrl, data.token);

      // 5. Publish camera & mic
      try {
        await currentRoom.localParticipant.enableCameraAndMicrophone();
      } catch (mediaErr) {
        console.warn("Could not enable camera/mic immediately:", mediaErr);
      }

      setRoom(currentRoom);
      syncParticipants();
      setConnecting(false);
    } catch (err) {
      console.error("Conference connect error:", err);
      setErrorMsg(err.message || "خطا در اتصال به اتاق ویدئو کنفرانس");
      setConnecting(false);
    }
  }, [chatId, onClose]);

  useEffect(() => {
    if (isOpen) {
      connectToConference();
    }
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [isOpen, connectToConference]);

  const toggleMic = useCallback(async () => {
    if (!room) return;
    const nextState = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(nextState);
    setIsMicOn(nextState);
  }, [room, isMicOn]);

  const toggleVideo = useCallback(async () => {
    if (!room) return;
    const nextState = !isVideoOn;
    await room.localParticipant.setCameraEnabled(nextState);
    setIsVideoOn(nextState);
  }, [room, isVideoOn]);

  const toggleScreen = useCallback(async () => {
    if (!room) return;
    const nextState = !isScreenSharing;
    try {
      await room.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
    } catch (err) {
      console.warn("Screen share toggled error:", err);
      setIsScreenSharing(false);
    }
  }, [room, isScreenSharing]);

  const handleLeave = useCallback(() => {
    if (room) {
      room.disconnect();
    }
    onClose?.();
  }, [room, onClose]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  if (!isOpen) return null;

  const totalParticipants = (room?.localParticipant ? 1 : 0) + participants.length;

  return (
    <div
      onMouseMove={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden"
    >
      {/* Header Bar */}
      <div
        className={`flex items-center justify-between px-6 py-4 border-b border-white/10 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{chatTitle || "ویدئو کنفرانس گروهی"}</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-xs text-white/50">
              {connecting ? "در حال اتصال به سرور..." : `${totalParticipants} شرکت‌کننده در جلسه`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip label={isFullscreen ? "خروج از تمام‌صفحه" : "تمام‌صفحه"}>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Conference Video Grid */}
      <div className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto">
        {connecting ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
            <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-white/70">
              در حال اتصال به اتاق کنفرانس SFU چکاوک...
            </p>
          </div>
        ) : errorMsg ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center p-6">
            <div className="rounded-2xl bg-rose-500/20 border border-rose-500/30 p-6 max-w-md">
              <p className="text-rose-300 text-sm font-semibold mb-3">{errorMsg}</p>
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`grid h-full w-full gap-4 transition-all duration-300 ${
              totalParticipants <= 1
                ? "grid-cols-1 max-w-4xl mx-auto"
                : totalParticipants === 2
                  ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto"
                  : totalParticipants <= 4
                    ? "grid-cols-2 max-w-6xl mx-auto"
                    : totalParticipants <= 6
                      ? "grid-cols-2 md:grid-cols-3 max-w-7xl mx-auto"
                      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {/* Local participant */}
            {room?.localParticipant && (
              <ParticipantTile participant={room.localParticipant} isLocal={true} />
            )}

            {/* Remote participants */}
            {participants.map((p) => (
              <ParticipantTile key={p.sid || p.identity} participant={p} isLocal={false} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Call Control Bar */}
      <div
        className={`flex items-center justify-center gap-4 pb-8 pt-4 transition-all duration-300 ${
          controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {/* Toggle Mic */}
        <Tooltip label={isMicOn ? "بی‌صدا کردن / Mute" : "فعال‌سازی صدا / Unmute"}>
          <button
            type="button"
            onClick={toggleMic}
            disabled={connecting}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 shadow-xl ${
              isMicOn
                ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                : "bg-rose-500 text-white shadow-rose-500/30 active:scale-95"
            }`}
            aria-label="Toggle Microphone"
          >
            {isMicOn ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
        </Tooltip>

        {/* Toggle Video */}
        <Tooltip label={isVideoOn ? "خاموش کردن دوربین" : "روشن کردن دوربین"}>
          <button
            type="button"
            onClick={toggleVideo}
            disabled={connecting}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 shadow-xl ${
              isVideoOn
                ? "bg-white/10 text-white hover:bg-white/20 active:scale-95"
                : "bg-rose-500 text-white shadow-rose-500/30 active:scale-95"
            }`}
            aria-label="Toggle Camera"
          >
            {isVideoOn ? <Video size={22} /> : <VideoOff size={22} />}
          </button>
        </Tooltip>

        {/* Share Screen */}
        <Tooltip label={isScreenSharing ? "توقف اشتراک صفحه" : "اشتراک صفحه نمایش"}>
          <button
            type="button"
            onClick={toggleScreen}
            disabled={connecting}
            className={`flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200 shadow-xl ${
              isScreenSharing
                ? "bg-emerald-500 text-white shadow-emerald-500/40"
                : "bg-white/10 text-white hover:bg-white/20 active:scale-95"
            }`}
            aria-label="Share Screen"
          >
            <MonitorUp size={22} />
          </button>
        </Tooltip>

        {/* Leave Conference */}
        <Tooltip label="خروج از جلسه / Leave">
          <button
            type="button"
            onClick={handleLeave}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/40 hover:bg-rose-700 active:scale-95 transition-all duration-200"
            aria-label="Leave Conference"
          >
            <Phone size={22} className="rotate-[135deg]" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});
