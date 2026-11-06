import { createPortal } from "react-dom";
import { useRef, useState } from "react";
import { Close, ShieldCheck, Lock, Copy, Check } from "../../icons/lucide.js";
import { useFocusTrap } from "../../hooks/useFocusTrap.js";

// Generates 4 deterministic emojis from the safety number
function getFingerprintEmojis(safetyNumber) {
  const emojiSet = ["🕊️", "🛡️", "🔐", "🌿", "💎", "⭐", "🌙", "🌊", "🪐", "🔥", "🌸", "⚡"];
  const digits = String(safetyNumber || "").replace(/\D/g, "");
  if (!digits || digits.length < 8) return ["🔒", "✨", "🔑", "🕊️"];
  const e1 = emojiSet[parseInt(digits.slice(0, 2), 10) % emojiSet.length];
  const e2 = emojiSet[parseInt(digits.slice(2, 4), 10) % emojiSet.length];
  const e3 = emojiSet[parseInt(digits.slice(4, 6), 10) % emojiSet.length];
  const e4 = emojiSet[parseInt(digits.slice(6, 8), 10) % emojiSet.length];
  return [e1, e2, e3, e4];
}

export default function E2EESafetyNumberModal({
  open,
  onClose,
  peerName,
  safetyNumber = "0000-0000-0000-0000",
}) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, open);
  const [copied, setCopied] = useState(false);

  if (!open || typeof document === "undefined") return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText?.(safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emojis = getFingerprintEmojis(safetyNumber);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-xs p-4 sm:p-6"
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
        aria-labelledby="e2ee-safety-title"
        className="w-full max-w-md rounded-3xl border border-emerald-500/20 bg-white p-6 shadow-2xl dark:border-emerald-500/30 dark:bg-slate-950 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 id="e2ee-safety-title" className="text-base font-bold text-slate-900 dark:text-white">
                کد امنیتی رمزنگاری سرتاسری
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                End-to-End Encryption (E2EE)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
          >
            <Close size={18} />
          </button>
        </div>

        {/* Visual Emoji Fingerprint */}
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
          {emojis.map((emoji, idx) => (
            <span key={idx} className="text-3xl filter drop-shadow-sm select-none" title="اثر انگشت بصری">
              {emoji}
            </span>
          ))}
        </div>

        {/* Safety Number Display */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            شماره تأیید هویت میان شما و <span className="font-semibold text-slate-800 dark:text-slate-200">{peerName || "مخاطب"}</span>:
          </p>
          <div className="font-mono text-xl sm:text-2xl font-bold tracking-widest text-emerald-600 dark:text-emerald-400 select-all" dir="ltr">
            {safetyNumber}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 transition"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span>کپی شد!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>کپی کد امنیتی</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-400 text-justify">
          🔒 تمامی پیام‌ها و تماس‌ها در این گفتگو مستقیماً با کلیدهای رمزنگاری نقطه به نقطه روی دستگاه‌های شما دو نفر قفل و بازگشایی می‌شوند. حتی سرور چکاوک نیز به محتوای این پیام‌ها دسترسی ندارد.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-500 transition"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
