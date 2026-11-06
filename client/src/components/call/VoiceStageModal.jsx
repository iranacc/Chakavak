import { memo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Close,
  Mic,
  MicOff,
  Hand,
  LogOut,
  Radio,
  AlertCircle,
  Check,
} from "../../icons/lucide.js";
import Avatar from "../common/Avatar.jsx";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

export const VoiceStageModal = memo(function VoiceStageModal({
  open,
  stage,
  currentUserId,
  isAdmin = false,
  isMuted = true,
  isRaisedHand = false,
  onToggleMic,
  onToggleRaiseHand,
  onPromoteSpeaker,
  onEndStage,
  onLeaveStage,
  onClose,
}) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);

  if (!open || !stage || typeof document === "undefined") return null;

  const speakers = Array.isArray(stage.speakers) ? stage.speakers : [];
  const participants = Array.isArray(stage.participants) ? stage.participants : [];
  const listeners = participants.filter((p) => !p.isSpeaker);
  const raisedHands = Array.isArray(stage.raisedHands) ? stage.raisedHands : [];

  const isCurrentSpeaker = speakers.some((s) => s.id === currentUserId);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
      style={{
        minHeight: "100dvh",
        height: "100dvh",
        paddingTop: "max(1.5rem, calc(env(safe-area-inset-top) + 1rem))",
        paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-stage-modal-title"
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              <Radio size={20} className="animate-spin-slow" />
            </div>
            <div>
              <h3 id="voice-stage-modal-title" className="text-base font-bold text-white">
                {stage.title || "اتاق گفتگوی صوتی"}
              </h3>
              <p className="text-xs text-white/60">
                {Number(stage.participantCount || 0).toLocaleString("fa-IR")} نفر حاضر • {speakers.length} سخنران
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition"
            title="کوچک کردن پنجره"
          >
            <Close size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="app-scroll flex-1 overflow-y-auto py-4 space-y-6">
          {/* Speakers Section */}
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Mic size={14} />
              <span>سخنرانان ({speakers.length})</span>
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-center transition hover:border-emerald-500/50"
                >
                  <div className="relative">
                    <Avatar
                      src={speaker.avatarUrl}
                      name={speaker.nickname || speaker.username}
                      color={speaker.color || "#10b981"}
                      className="h-14 w-14 text-lg shadow-lg ring-2 ring-emerald-400/60"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                      <Mic size={11} />
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-white/90 truncate max-w-[90px]">
                    {speaker.nickname || speaker.username}
                    {speaker.id === currentUserId && " (شما)"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Raised Hands Section (for Admins / Moderators) */}
          {raisedHands.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Hand size={14} className="animate-bounce" />
                <span>درخواست‌های صحبت ({raisedHands.length})</span>
              </h4>
              <div className="space-y-2">
                {raisedHands.map((userId) => {
                  const userObj = participants.find((p) => p.id === userId);
                  if (!userObj) return null;
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between gap-2 rounded-xl bg-black/40 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={userObj.avatarUrl}
                          name={userObj.nickname || userObj.username}
                          className="h-7 w-7 text-xs"
                        />
                        <span className="text-xs font-medium text-white/90 truncate">
                          {userObj.nickname || userObj.username}
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => onPromoteSpeaker?.(userId, true)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition border border-emerald-500/30"
                        >
                          <Check size={12} />
                          <span>اجازه صحبت</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Listeners Section */}
          {listeners.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">
                شنوندگان ({listeners.length})
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                {listeners.map((listener) => (
                  <div
                    key={listener.id}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-white/5 p-2 text-center"
                  >
                    <Avatar
                      src={listener.avatarUrl}
                      name={listener.nickname || listener.username}
                      color={listener.color || "#64748b"}
                      className="h-10 w-10 text-sm"
                    />
                    <span className="text-[11px] text-white/70 truncate max-w-[70px]">
                      {listener.nickname || listener.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Controls */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Mic Toggle (only enabled if speaker) */}
            <button
              type="button"
              disabled={!isCurrentSpeaker}
              onClick={onToggleMic}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                !isCurrentSpeaker
                  ? "border border-white/10 bg-white/5 text-white/40 cursor-not-allowed"
                  : !isMuted
                    ? "border border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "border border-white/10 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
              <span>{isMuted ? "بی‌صدا" : "میکروفون وصل"}</span>
            </button>

            {/* Raise Hand Toggle */}
            <button
              type="button"
              onClick={onToggleRaiseHand}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold border transition ${
                isRaisedHand
                  ? "border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/30"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Hand size={16} className={isRaisedHand ? "text-amber-400 animate-bounce" : ""} />
              <span>{isRaisedHand ? "دست پایین" : "درخواست صحبت"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* End Stage (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={onEndStage}
                className="flex items-center gap-1.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
                title="پایان گفتگو برای همه"
              >
                <AlertCircle size={14} />
                <span className="hidden sm:inline">پایان اتاق</span>
              </button>
            )}

            {/* Leave Stage */}
            <button
              type="button"
              onClick={onLeaveStage}
              className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500 transition"
            >
              <LogOut size={16} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});
