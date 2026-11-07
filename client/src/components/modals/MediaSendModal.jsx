import { useState, useEffect, useMemo } from "react";
import {
  Close,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Send,
  LoaderCircle,
  ImageIcon,
  Video,
  Check,
} from "../../icons/lucide.js";
import {
  compressImageFile,
  compressVideoFile,
  formatFileSize,
  calculateSavingsPercent,
  IMAGE_QUALITY_PRESETS,
  VIDEO_QUALITY_PRESETS,
} from "../../utils/mediaCompressor.js";

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

  // Per-item settings map: { [itemId]: { imagePreset: "balanced", videoPreset: "720p", muteAudio: false } }
  const [itemSettings, setItemSettings] = useState({});

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      setCaption(initialCaption || "");
      setIsProcessing(false);
      setProcessingProgress(0);

      // Initialize default settings for items
      const initial = {};
      items.forEach((item) => {
        initial[item.id] = {
          imagePreset: "balanced",
          videoPreset: "720p",
          muteAudio: false,
        };
      });
      setItemSettings(initial);
    }
  }, [isOpen, items, initialCaption]);

  const activeItem = items[activeIndex] || items[0] || null;
  const isImage = Boolean(activeItem?.mimeType?.startsWith("image/"));
  const isVideo = Boolean(activeItem?.mimeType?.startsWith("video/"));

  const currentSettings = activeItem ? (itemSettings[activeItem.id] || {
    imagePreset: "balanced",
    videoPreset: "720p",
    muteAudio: false,
  }) : {
    imagePreset: "balanced",
    videoPreset: "720p",
    muteAudio: false,
  };

  const updateActiveSetting = (key, val) => {
    if (!activeItem) return;
    setItemSettings((prev) => ({
      ...prev,
      [activeItem.id]: {
        ...(prev[activeItem.id] || {
          imagePreset: "balanced",
          videoPreset: "720p",
          muteAudio: false,
        }),
        [key]: val,
      },
    }));
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
      // Empirical estimates: balanced ~ 85-92% reduction on camera photos; eco ~ 93-97%
      const ratio = preset === "eco" ? 0.05 : 0.10;
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
      if (preset === "original" && !currentSettings.muteAudio) {
        return {
          originalFormatted: formatFileSize(origSize),
          compressedFormatted: formatFileSize(origSize),
          savingsPercent: 0,
          label: "کیفیت اصلی (بدون تبدیل)",
        };
      }
      const dur = Number(activeItem.durationSeconds || 10);
      const bps = preset === "480p" ? 1800000 : 3200000;
      const estComp = Math.min(origSize, Math.max(100 * 1024, Math.round((bps * dur) / 8)));
      const savings = calculateSavingsPercent(origSize, estComp);
      return {
        originalFormatted: formatFileSize(origSize),
        compressedFormatted: `~${formatFileSize(estComp)}`,
        savingsPercent: savings,
        label: preset === "480p" ? "ویدیو ۴۸۰p اقتصادی" : "ویدیو ۷۲۰p HD روان",
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
      } else if (isVid && (settings.videoPreset !== "original" || settings.muteAudio)) {
        try {
          const compResult = await compressVideoFile(item.file, {
            targetQuality: settings.videoPreset,
            muteAudio: settings.muteAudio,
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
              <h2 className="text-sm font-bold text-white">ارسال و بهینه‌سازی مدیا</h2>
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
        <div className="relative flex-1 min-h-[220px] max-h-[380px] bg-slate-950/70 flex items-center justify-center p-2 overflow-hidden select-none">
          {isImage ? (
            <img
              src={activeItem?.previewUrl}
              alt={activeItem?.name || "Preview"}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-lg"
            />
          ) : isVideo ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <video
                src={activeItem?.previewUrl}
                controls
                playsInline
                muted={currentSettings.muteAudio}
                className="max-h-[340px] max-w-full rounded-2xl object-contain shadow-lg"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-white/60">
              <span className="text-4xl">📄</span>
              <span className="text-xs">{activeItem?.name}</span>
            </div>
          )}

          {/* Size Savings Badge Overlay */}
          {estimatedInfo && estimatedInfo.savingsPercent > 0 ? (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-md animate-pop-in">
              <Zap size={13} className="text-amber-200 fill-amber-200" />
              <span>{estimatedInfo.savingsPercent}٪ کاهش حجم</span>
            </div>
          ) : null}
        </div>

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
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-3 gap-1.5 flex-1">
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

                {/* Mute Video Button */}
                <button
                  type="button"
                  onClick={() => updateActiveSetting("muteAudio", !currentSettings.muteAudio)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition ${
                    currentSettings.muteAudio
                      ? "bg-rose-500/20 border-rose-400 text-rose-300 font-bold"
                      : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
                  }`}
                  title="ارسال ویدیو بدون صدا"
                >
                  {currentSettings.muteAudio ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{currentSettings.muteAudio ? "بدون صدا" : "با صدا"}</span>
                </button>
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
