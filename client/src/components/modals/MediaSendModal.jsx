import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Close,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  LoaderCircle,
  ImageIcon,
  Video,
  Rotate,
  Scissors,
  Repeat,
} from "../../icons/lucide.js";
import {
  compressImageFile,
  compressVideoFile,
  formatFileSize,
  calculateSavingsPercent,
  IMAGE_QUALITY_PRESETS,
  VIDEO_QUALITY_PRESETS,
} from "../../utils/mediaCompressor.js";

function formatVideoTime(secs) {
  const s = Math.max(0, Math.floor(Number(secs) || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
}

export default function MediaSendModal({
  isOpen,
  onClose,
  items = [],
  onConfirm,
  initialCaption = "",
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [caption, setCaption] = useState(initialCaption || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Per-item settings map:
  // { [itemId]: { imagePreset, videoPreset, muteAudio, trimStart, trimEnd, rotation, isGif } }
  const [itemSettings, setItemSettings] = useState({});

  const previewVideoRef = useRef(null);
  const timelineTrackRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setCaption(initialCaption || "");
      setIsProcessing(false);
      setProcessingProgress(0);
      setIsPlayingPreview(false);

      const initial = {};
      items.forEach((item) => {
        const dur = Number(item.durationSeconds || 0);
        initial[item.id] = {
          imagePreset: "balanced",
          videoPreset: "720p",
          muteAudio: false,
          trimStart: 0,
          trimEnd: dur > 0 ? dur : null,
          rotation: 0,
          isGif: false,
        };
      });
      setItemSettings(initial);
    }
  }, [isOpen, items, initialCaption]);

  const activeItem = items[activeIndex] || items[0] || null;
  const isImage = Boolean(activeItem?.mimeType?.startsWith("image/"));
  const isVideo = Boolean(activeItem?.mimeType?.startsWith("video/"));

  const currentSettings = activeItem
    ? itemSettings[activeItem.id] || {
        imagePreset: "balanced",
        videoPreset: "720p",
        muteAudio: false,
        trimStart: 0,
        trimEnd: null,
        rotation: 0,
        isGif: false,
      }
    : {
        imagePreset: "balanced",
        videoPreset: "720p",
        muteAudio: false,
        trimStart: 0,
        trimEnd: null,
        rotation: 0,
        isGif: false,
      };

  const updateActiveSetting = useCallback((key, val) => {
    if (!activeItem) return;
    setItemSettings((prev) => ({
      ...prev,
      [activeItem.id]: {
        ...(prev[activeItem.id] || {
          imagePreset: "balanced",
          videoPreset: "720p",
          muteAudio: false,
          trimStart: 0,
          trimEnd: null,
          rotation: 0,
          isGif: false,
        }),
        [key]: val,
      },
    }));
  }, [activeItem]);

  const activeItemDuration = Number(
    activeItem?.durationSeconds || previewVideoRef.current?.duration || 10,
  );
  const curTrimStart = Math.max(0, currentSettings.trimStart || 0);
  const curTrimEnd =
    currentSettings.trimEnd && currentSettings.trimEnd > curTrimStart
      ? currentSettings.trimEnd
      : activeItemDuration;
  const effectiveDuration = Math.max(0.5, curTrimEnd - curTrimStart);

  // Synchronize duration once metadata loads
  const handlePreviewVideoLoaded = (e) => {
    const v = e.target;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      if (!currentSettings.trimEnd || currentSettings.trimEnd > v.duration) {
        updateActiveSetting("trimEnd", v.duration);
      }
    }
  };

  // Keep video playback bounded within the trimmed region
  const handlePreviewVideoTimeUpdate = (e) => {
    const v = e.target;
    if (!v) return;
    const start = currentSettings.trimStart || 0;
    const end = currentSettings.trimEnd || v.duration || activeItemDuration;

    if (end > start && v.currentTime >= end) {
      v.currentTime = start;
      if (!v.paused) {
        v.play().catch(() => {});
      }
    }
  };

  const togglePreviewPlayback = () => {
    const v = previewVideoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < curTrimStart || v.currentTime >= curTrimEnd) {
        v.currentTime = curTrimStart;
      }
      v.play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => {});
    } else {
      v.pause();
      setIsPlayingPreview(false);
    }
  };

  // Interactive timeline scrubber dragging logic
  const handleHandlePointerDown = (type, e) => {
    e.preventDefault();
    e.stopPropagation();

    const track = timelineTrackRef.current;
    if (!track) return;

    const dur = activeItemDuration || 10;
    const rect = track.getBoundingClientRect();

    const onPointerMove = (moveEvent) => {
      const clientX = moveEvent.clientX;
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetTime = Math.round(fraction * dur * 10) / 10;

      if (type === "start") {
        const curEnd = currentSettings.trimEnd ?? dur;
        const safeStart = Math.max(0, Math.min(curEnd - 0.5, targetTime));
        updateActiveSetting("trimStart", safeStart);
        if (previewVideoRef.current) {
          previewVideoRef.current.currentTime = safeStart;
        }
      } else {
        const curStart = currentSettings.trimStart ?? 0;
        const safeEnd = Math.max(curStart + 0.5, Math.min(dur, targetTime));
        updateActiveSetting("trimEnd", safeEnd);
        if (previewVideoRef.current) {
          previewVideoRef.current.currentTime = safeEnd;
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  const handleTrackClick = (e) => {
    const track = timelineTrackRef.current;
    if (!track) return;
    const dur = activeItemDuration || 10;
    const rect = track.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickTime = fraction * dur;

    // Seek preview video to clicked position
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = Math.max(
        curTrimStart,
        Math.min(curTrimEnd, clickTime),
      );
    }
  };

  // Estimated size calculation for display
  const estimatedInfo = useMemo(() => {
    if (!activeItem) return null;
    const origSize = Number(activeItem.sizeBytes || activeItem.file?.size || 0);

    if (isImage) {
      const preset = currentSettings.imagePreset || "balanced";
      if (preset === "original" || activeItem.mimeType === "image/gif") {
        return {
          originalFormatted: formatFileSize(origSize),
          compressedFormatted: formatFileSize(origSize),
          savingsPercent: 0,
          label: "کیفیت اصلی (بدون فشرده‌سازی)",
        };
      }
      const ratio = preset === "eco" ? 0.05 : 0.1;
      const estComp = Math.min(origSize, Math.max(40 * 1024, Math.round(origSize * ratio)));
      const savings = calculateSavingsPercent(origSize, estComp);
      return {
        originalFormatted: formatFileSize(origSize),
        compressedFormatted: `~${formatFileSize(estComp)}`,
        savingsPercent: savings,
        label: preset === "eco" ? "فشرده اقتصادی (HD 720p)" : "فشرده بهینه (Full HD 1080p)",
      };
    }

    if (isVideo) {
      const preset = currentSettings.videoPreset || "720p";
      const totalDur = Number(activeItem.durationSeconds || 10);
      const trimStart = currentSettings.trimStart || 0;
      const trimEnd = currentSettings.trimEnd || totalDur;
      const effectiveDur = Math.max(0.5, trimEnd - trimStart);

      const hasEdits =
        trimStart > 0.05 ||
        trimEnd < totalDur - 0.05 ||
        (currentSettings.rotation && currentSettings.rotation > 0) ||
        currentSettings.isGif;

      if (preset === "original" && !currentSettings.muteAudio && !hasEdits) {
        return {
          originalFormatted: formatFileSize(origSize),
          compressedFormatted: formatFileSize(origSize),
          savingsPercent: 0,
          label: "کیفیت اصلی (بدون تغییر)",
        };
      }

      const bps = preset === "480p" ? 1800000 : 3200000;
      const estComp = Math.min(
        origSize,
        Math.max(100 * 1024, Math.round((bps * effectiveDur) / 8)),
      );
      const savings = calculateSavingsPercent(origSize, estComp);
      return {
        originalFormatted: formatFileSize(origSize),
        compressedFormatted: `~${formatFileSize(estComp)}`,
        savingsPercent: savings,
        label: `${preset === "480p" ? "۴۸۰p بهینه" : "۷۲۰p HD"} • ${formatVideoTime(effectiveDur)}`,
      };
    }

    return {
      originalFormatted: formatFileSize(origSize),
      compressedFormatted: formatFileSize(origSize),
      savingsPercent: 0,
      label: "فایل مستقیم",
    };
  }, [activeItem, isImage, isVideo, currentSettings]);

  if (!isOpen || !items.length) return null;

  const handleSend = async (sendImmediately = true) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setProcessingProgress(0);

    const processedItems = [];
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const item = items[i];
      const settings = itemSettings[item.id] || {
        imagePreset: "balanced",
        videoPreset: "720p",
        muteAudio: false,
        trimStart: 0,
        trimEnd: null,
        rotation: 0,
        isGif: false,
      };

      const isImg = item.mimeType?.startsWith("image/");
      const isVid = item.mimeType?.startsWith("video/");

      let processedFile = item.file;
      let width = item.width;
      let height = item.height;
      let durationSeconds = item.durationSeconds;
      let sizeBytes = item.sizeBytes;
      let previewUrl = item.previewUrl;

      if (isImg && settings.imagePreset !== "original") {
        try {
          const compResult = await compressImageFile(item.file, {
            preset: settings.imagePreset,
          });
          if (compResult && compResult.file) {
            processedFile = compResult.file;
            width = compResult.width || width;
            height = compResult.height || height;
            sizeBytes = compResult.compressedSizeBytes || processedFile.size;
            if (compResult.previewUrl) previewUrl = compResult.previewUrl;
          }
        } catch (err) {
          console.warn("Image compression error, using original:", err);
        }
      } else if (isVid) {
        const hasEdits =
          (settings.trimStart && settings.trimStart > 0.05) ||
          (settings.trimEnd && settings.trimEnd < (item.durationSeconds || 10) - 0.05) ||
          settings.rotation !== 0 ||
          settings.isGif ||
          settings.muteAudio ||
          settings.videoPreset !== "original";

        if (hasEdits) {
          try {
            const compResult = await compressVideoFile(item.file, {
              targetQuality: settings.videoPreset,
              muteAudio: settings.muteAudio || settings.isGif,
              trimStart: settings.trimStart || 0,
              trimEnd: settings.trimEnd || null,
              rotation: settings.rotation || 0,
              isGif: settings.isGif,
              onProgress: (p) => {
                const base = (i / total) * 100;
                const share = (1 / total) * 100;
                setProcessingProgress(Math.min(99, Math.round(base + p * share)));
              },
            });
            if (compResult && compResult.file) {
              processedFile = compResult.file;
              width = compResult.width || width;
              height = compResult.height || height;
              durationSeconds = compResult.duration ?? durationSeconds;
              sizeBytes = compResult.compressedSizeBytes || processedFile.size;
              if (compResult.previewUrl) previewUrl = compResult.previewUrl;
            }
          } catch (err) {
            console.warn("Video compression error, using original:", err);
          }
        }
      }

      processedItems.push({
        ...item,
        file: processedFile,
        sizeBytes,
        originalSizeBytes: item.sizeBytes,
        width,
        height,
        durationSeconds,
        previewUrl,
        compressionPreset: isImg ? settings.imagePreset : isVid ? settings.videoPreset : "original",
        savingsPercent: calculateSavingsPercent(item.sizeBytes, sizeBytes),
      });

      setProcessingProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsProcessing(false);
    onConfirm?.(processedItems, caption.trim(), sendImmediately);
    onClose?.();
  };

  const startPct = Math.max(0, Math.min(100, (curTrimStart / activeItemDuration) * 100));
  const endPct = Math.max(startPct, Math.min(100, (curTrimEnd / activeItemDuration) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose?.();
      }}
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 select-none">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              {isImage ? <ImageIcon size={18} /> : <Video size={18} />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">ویرایش و بهینه‌سازی مدیا</h2>
              <p className="text-[11px] text-white/60">
                {items.length > 1 ? `فایل ${activeIndex + 1} از ${items.length}` : activeItem?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            aria-label="Close"
          >
            <Close size={18} />
          </button>
        </div>

        {/* Media Preview Container */}
        <div className="relative flex-1 min-h-[200px] max-h-[340px] bg-slate-950/70 flex items-center justify-center p-2 overflow-hidden select-none">
          {isImage ? (
            <img
              src={activeItem?.previewUrl}
              alt={activeItem?.name || "Preview"}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-lg"
            />
          ) : isVideo ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <video
                ref={previewVideoRef}
                src={activeItem?.previewUrl}
                playsInline
                muted={currentSettings.muteAudio || currentSettings.isGif}
                onLoadedMetadata={handlePreviewVideoLoaded}
                onTimeUpdate={handlePreviewVideoTimeUpdate}
                onClick={togglePreviewPlayback}
                style={{
                  transform: `rotate(${currentSettings.rotation || 0}deg)`,
                  transition: "transform 0.2s ease-out",
                }}
                className="max-h-[300px] max-w-full rounded-2xl object-contain shadow-lg cursor-pointer"
              />

              {/* Play / Pause Overlay Button */}
              {!isPlayingPreview ? (
                <button
                  type="button"
                  onClick={togglePreviewPlayback}
                  className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/80 text-white border border-white/20 shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 transition"
                  aria-label="Play Preview"
                >
                  <Play size={24} className="translate-x-0.5 text-emerald-400 fill-emerald-400" />
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-white/60">
              <span className="text-4xl">📄</span>
              <span className="text-xs">{activeItem?.name}</span>
            </div>
          )}

          {/* Size Savings Badge Overlay */}
          {estimatedInfo && estimatedInfo.savingsPercent > 0 && !isProcessing ? (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-md animate-pop-in">
              <Zap size={13} className="text-amber-200 fill-amber-200" />
              <span>{estimatedInfo.savingsPercent}٪ کاهش حجم</span>
            </div>
          ) : null}

          {/* Processing Progress Overlay */}
          {isProcessing ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm p-6 text-center space-y-3 animate-fade-in">
              <div className="relative flex items-center justify-center">
                <LoaderCircle size={48} className="text-emerald-400 animate-spin" />
                <span className="absolute text-[12px] font-bold text-white font-mono">{processingProgress}%</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">در حال بهینه‌سازی مدیا...</p>
                <p className="text-[11px] text-white/60 max-w-xs">
                  پردازش روان با شتاب‌دهنده سخت‌افزاری جهت کاهش حجم و ارسال پرسرعت
                </p>
              </div>
              <div className="w-52 h-2 rounded-full bg-white/10 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Video Trimming Timeline Bar (Telegram Style) */}
        {isVideo && !isProcessing ? (
          <div className="px-5 py-2.5 bg-slate-950/60 border-t border-white/5 space-y-1.5 select-none">
            <div className="flex items-center justify-between text-[11px] text-white/80">
              <span className="flex items-center gap-1 font-mono dir-ltr">
                <Scissors size={12} className="text-emerald-400" />
                <span className="font-semibold text-emerald-300">{formatVideoTime(curTrimStart)}</span>
                <span className="text-white/40">➔</span>
                <span className="font-semibold text-emerald-300">{formatVideoTime(curTrimEnd)}</span>
              </span>
              <span className="text-emerald-400 font-medium">
                زمان برگزیده: {formatVideoTime(effectiveDuration)}
              </span>
            </div>

            {/* Interactive Dual-Handle Timeline Scrubber */}
            <div
              ref={timelineTrackRef}
              className="relative w-full h-8 rounded-xl bg-slate-900 border border-white/15 overflow-hidden flex items-center cursor-pointer dir-ltr"
              onClick={handleTrackClick}
            >
              {/* Visual background ticks / filmstrip effect */}
              <div className="absolute inset-0 opacity-25 flex justify-between px-2 items-center pointer-events-none">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div key={idx} className="w-0.5 h-3 bg-white/40 rounded-full" />
                ))}
              </div>

              {/* Selected highlighted segment */}
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/30 border-y-2 border-emerald-400 pointer-events-none"
                style={{
                  left: `${startPct}%`,
                  width: `${Math.max(2, endPct - startPct)}%`,
                }}
              />

              {/* Left handle (trimStart) */}
              <div
                className="absolute top-0 bottom-0 w-4 bg-emerald-400 hover:bg-emerald-300 rounded-l-lg cursor-ew-resize flex items-center justify-center shadow-lg select-none touch-none z-20 -translate-x-1/2 transition-colors active:scale-105 active:bg-emerald-200"
                style={{ left: `${startPct}%` }}
                onPointerDown={(e) => handleHandlePointerDown("start", e)}
                title="نقطه شروع ویدیو"
              >
                <div className="w-0.5 h-3.5 bg-slate-950 rounded-full" />
              </div>

              {/* Right handle (trimEnd) */}
              <div
                className="absolute top-0 bottom-0 w-4 bg-emerald-400 hover:bg-emerald-300 rounded-r-lg cursor-ew-resize flex items-center justify-center shadow-lg select-none touch-none z-20 -translate-x-1/2 transition-colors active:scale-105 active:bg-emerald-200"
                style={{ left: `${endPct}%` }}
                onPointerDown={(e) => handleHandlePointerDown("end", e)}
                title="نقطه پایان ویدیو"
              >
                <div className="w-0.5 h-3.5 bg-slate-950 rounded-full" />
              </div>
            </div>
          </div>
        ) : null}

        {/* Multiple Items Selector Bar */}
        {items.length > 1 ? (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5 bg-slate-900/60 overflow-x-auto chat-scroll">
            {items.map((item, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border-2 transition ${
                    isSelected
                      ? "border-emerald-400 ring-2 ring-emerald-500/40 scale-105"
                      : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  {item.mimeType?.startsWith("image/") ? (
                    <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : item.mimeType?.startsWith("video/") ? (
                    <div className="relative h-full w-full bg-slate-800 flex items-center justify-center">
                      <Play size={12} className="text-white" />
                    </div>
                  ) : (
                    <div className="h-full w-full bg-slate-800 flex items-center justify-center text-xs">📄</div>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Compression & Quality Controls */}
        <div className="px-5 py-3.5 border-t border-white/10 space-y-3 bg-slate-900">
          {isImage ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-white/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-400" />
                  کیفیت و اندازه تصویر:
                </span>
                {estimatedInfo ? (
                  <span className="text-[11px] text-white/60 dir-ltr font-mono">
                    {estimatedInfo.originalFormatted} ➔ <span className="text-emerald-300 font-bold">{estimatedInfo.compressedFormatted}</span>
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "balanced", label: "⚡ فشرده هوشمند", sub: "1080p WebP (پیشنهادی)" },
                  { id: "eco", label: "📐 اقتصادی", sub: "720p کم‌حجم" },
                  { id: "original", label: "💎 کیفیت اصلی", sub: "بدون تغییر سایز" },
                ].map((preset) => {
                  const isChosen = currentSettings.imagePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => updateActiveSetting("imagePreset", preset.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition ${
                        isChosen
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20 font-bold"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-xs">{preset.label}</span>
                      <span className="text-[10px] text-white/50">{preset.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : isVideo ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Video size={14} className="text-emerald-400" />
                  تنظیمات ویدیو:
                </span>
                {estimatedInfo ? (
                  <span className="text-[11px] text-white/60 dir-ltr font-mono">
                    {estimatedInfo.originalFormatted} ➔ <span className="text-emerald-300 font-bold">{estimatedInfo.compressedFormatted}</span>
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="grid grid-cols-3 gap-1.5 flex-1 min-w-[200px]">
                  {[
                    { id: "720p", label: "720p HD" },
                    { id: "480p", label: "480p بهینه" },
                    { id: "original", label: "کیفیت اصلی" },
                  ].map((preset) => {
                    const isChosen = currentSettings.videoPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => updateActiveSetting("videoPreset", preset.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-xs text-center transition ${
                          isChosen
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Editing Tools for Video */}
                <div className="flex items-center gap-1.5">
                  {/* Rotate Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextRot = ((currentSettings.rotation || 0) + 90) % 360;
                      updateActiveSetting("rotation", nextRot);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition ${
                      currentSettings.rotation > 0
                        ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                    title="چرخش ۹۰ درجه ساعت‌گرد"
                  >
                    <Rotate size={13} className={currentSettings.rotation > 0 ? "text-amber-300" : ""} />
                    <span>{currentSettings.rotation ? `${currentSettings.rotation}°` : "چرخش"}</span>
                  </button>

                  {/* Send as GIF Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const nextGif = !currentSettings.isGif;
                      updateActiveSetting("isGif", nextGif);
                      if (nextGif) {
                        updateActiveSetting("muteAudio", true);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs transition ${
                      currentSettings.isGif
                        ? "bg-purple-500/20 border-purple-400 text-purple-200 font-bold shadow-sm shadow-purple-500/20"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                    title="ارسال ویدیو به صورت گیف متحرک بدون صدا"
                  >
                    <Repeat size={13} />
                    <span>گیف</span>
                  </button>

                  {/* Mute Video Button */}
                  <button
                    type="button"
                    onClick={() => updateActiveSetting("muteAudio", !currentSettings.muteAudio)}
                    disabled={currentSettings.isGif}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition disabled:opacity-50 ${
                      currentSettings.muteAudio
                        ? "bg-rose-500/20 border-rose-400 text-rose-300 font-bold"
                        : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                    }`}
                    title="ارسال ویدیو بدون صدا"
                  >
                    {currentSettings.muteAudio ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{currentSettings.muteAudio ? "بی‌صدا" : "صدا"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* Caption Input */}
          <div className="relative pt-1">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="افزودن کپشن / متن پیام..."
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 transition"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-950/80">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            انصراف
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSend(false)}
              className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="انتقال فایل‌های بهینه‌شده به پیام‌ساز جهت ویرایش بیشتر"
            >
              افزودن به پیام
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSend(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  <span>در حال بهینه‌سازی ({processingProgress}٪)...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>ارسال</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
