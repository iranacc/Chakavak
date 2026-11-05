import { Bold, Italic, Code, Strikethrough, Eye } from "../../../icons/lucide.js";

export default function FormattingToolbar({
  visible,
  textareaRef,
  onApplyFormat,
}) {
  if (!visible) return null;

  const handleFormat = (prefix, suffix = prefix) => {
    const el = textareaRef?.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const val = el.value || "";

    if (start === end) return; // No text selected

    const selectedText = val.substring(start, end);

    // Check if already formatted to toggle off
    const isAlreadyFormatted =
      selectedText.startsWith(prefix) && selectedText.endsWith(suffix);

    let newSelectedText = "";
    let newStart = start;
    let newEnd = end;

    if (isAlreadyFormatted) {
      newSelectedText = selectedText.slice(
        prefix.length,
        selectedText.length - suffix.length
      );
      newEnd = start + newSelectedText.length;
    } else {
      newSelectedText = `${prefix}${selectedText}${suffix}`;
      newEnd = start + newSelectedText.length;
    }

    const nextValue =
      val.substring(0, start) + newSelectedText + val.substring(end);

    onApplyFormat(nextValue, newStart, newEnd);
  };

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="absolute -top-11 left-12 z-30 flex items-center gap-0.5 rounded-xl border border-emerald-200/80 bg-white/95 p-1 shadow-lg shadow-emerald-950/10 backdrop-blur-md dark:border-emerald-500/30 dark:bg-slate-900/95 dark:shadow-black/40"
      onMouseDown={(e) => e.preventDefault()} // Prevent textarea blur on click
    >
      <button
        type="button"
        onClick={() => handleFormat("**")}
        title="Bold / پررنگ (**text**)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200"
      >
        <Bold size={15} />
      </button>

      <button
        type="button"
        onClick={() => handleFormat("*")}
        title="Italic / مورب (*text*)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200"
      >
        <Italic size={15} />
      </button>

      <button
        type="button"
        onClick={() => handleFormat("`")}
        title="Inline Code / کد (`code`)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200"
      >
        <Code size={15} />
      </button>

      <button
        type="button"
        onClick={() => handleFormat("~~")}
        title="Strikethrough / خط‌خورده (~~text~~)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-emerald-100 hover:text-emerald-800 dark:text-slate-200 dark:hover:bg-emerald-500/20 dark:hover:text-emerald-200"
      >
        <Strikethrough size={15} />
      </button>

      <div className="mx-0.5 h-4 w-px bg-slate-200 dark:bg-slate-700" />

      <button
        type="button"
        onClick={() => handleFormat("||")}
        title="Spoiler / مخفی کردن متن (||spoiler||)"
        className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
      >
        <Eye size={14} />
        <span>اسپویلر</span>
      </button>
    </div>
  );
}
