import { memo, useState } from "react";
import { Mic, MicOff, Hand, Maximize, LogOut, Radio } from "../../icons/lucide.js";

export const FloatingVoiceStageBar = memo(function FloatingVoiceStageBar({
  stage,
  isMuted = true,
  isRaisedHand = false,
  isSpeaking = false,
  onToggleMic,
  onToggleRaiseHand,
  onOpenStageModal,
  onLeaveStage,
}) {
  if (!stage) return null;

  return (
    <div
      role="region"
      aria-label="کنترل گفتگوی صوتی فعال"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-45 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl text-white max-w-[92vw] sm:max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      {/* Title & Live Soundwaves */}
      <div
        onClick={onOpenStageModal}
        className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
      >
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
          {isSpeaking ? (
            <span className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 h-full bg-white animate-pulse" />
              <span className="w-0.5 h-2 bg-white animate-pulse delay-75" />
              <span className="w-0.5 h-3 bg-white animate-pulse delay-150" />
            </span>
          ) : (
            <Radio size={16} />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-white group-hover:text-emerald-300 transition">
            {stage.title || "اتاق صوتی زنده"}
          </p>
          <p className="text-[10px] text-white/60 truncate">
            {Number(stage.participantCount || 0).toLocaleString("fa-IR")} نفر حاضر • لمس برای نمایش
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Mic Mute / Unmute */}
        <button
          type="button"
          onClick={onToggleMic}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            !isMuted
              ? "border-emerald-500 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
          title={isMuted ? "وصل میکروفون" : "بی‌صدا کردن"}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} className="text-emerald-400" />}
        </button>

        {/* Raise Hand */}
        <button
          type="button"
          onClick={onToggleRaiseHand}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
            isRaisedHand
              ? "border-amber-500 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 ring-2 ring-amber-400/30"
              : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
          }`}
          title={isRaisedHand ? "پایین آوردن دست" : "دست بلند کردن برای صحبت"}
        >
          <Hand size={16} className={isRaisedHand ? "text-amber-400 animate-bounce" : ""} />
        </button>

        {/* Expand / Maximize to full modal */}
        <button
          type="button"
          onClick={onOpenStageModal}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 transition"
          title="مشاهده اتاق صوتی"
        >
          <Maximize size={16} />
        </button>

        {/* Leave Stage */}
        <button
          type="button"
          onClick={onLeaveStage}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition ml-1"
          title="خروج از اتاق صوتی"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
});
