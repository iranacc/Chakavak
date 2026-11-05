import { Pin, Close } from "../../../icons/lucide.js";
import { hasPersian } from "../../../utils/fontUtils.js";

export default function PinnedMessageBar({
  pinnedMessage,
  onJumpToMessage,
  onUnpin,
  canUnpin = true,
}) {
  if (!pinnedMessage) return null;

  const rawText = String(
    pinnedMessage.body?.text ?? pinnedMessage.body ?? pinnedMessage.text ?? ""
  ).trim();
  const authorName =
    pinnedMessage.nickname || pinnedMessage.username || "Message";
  const authorColor = pinnedMessage.color || "#10b981";
  const previewText = rawText || (pinnedMessage.files?.length ? "Attachment" : "Pinned Message");

  return (
    <div
      role="region"
      aria-label="Pinned message"
      className="relative z-10 flex items-center justify-between border-b border-emerald-200/80 bg-white/90 px-4 py-2 shadow-xs backdrop-blur-md transition sm:px-6 dark:border-emerald-500/20 dark:bg-slate-900/90"
      style={{ animation: "popover-in 140ms ease-out" }}
    >
      <button
        type="button"
        onClick={() => onJumpToMessage?.(pinnedMessage.id)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition hover:opacity-85"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-300">
          <Pin size={16} className="rotate-45" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              پیام سنجاق‌شده • Pinned
            </span>
            <span
              className="truncate text-[11px] font-semibold opacity-90"
              style={{ color: authorColor }}
            >
              {authorName}
            </span>
          </div>

          <p
            className={`truncate text-xs text-slate-700 dark:text-slate-200 ${
              hasPersian(previewText) ? "font-fa" : ""
            }`}
            dir="auto"
          >
            {previewText}
          </p>
        </div>
      </button>

      {canUnpin ? (
        <button
          type="button"
          onClick={onUnpin}
          title="Unpin message / لغو سنجاق"
          className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label="Unpin message"
        >
          <Close size={14} />
        </button>
      ) : null}
    </div>
  );
}
