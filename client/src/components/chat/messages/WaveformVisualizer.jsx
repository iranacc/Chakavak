import { Trash } from "../../../icons/lucide.js";

export default function WaveformVisualizer({
  durationText,
  onCancel,
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between rounded-2xl border border-rose-200/80 bg-rose-50/70 px-4 py-2 text-sm shadow-inner dark:border-rose-500/30 dark:bg-rose-950/40">
      {/* Live recording indicator & timer */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-600" />
        </span>
        <span className="font-mono text-sm font-bold text-rose-700 dark:text-rose-300">
          {durationText}
        </span>
      </div>

      {/* Dynamic pulsating animated sound wave bars */}
      <div className="flex items-center gap-1 overflow-hidden px-2">
        {[40, 80, 55, 95, 30, 75, 100, 60, 85, 45, 90, 70, 35, 65, 80].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-rose-500 dark:bg-rose-400"
            style={{
              height: `${Math.max(6, (h * 24) / 100)}px`,
              animation: `pulse-waveform ${0.6 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.08).toFixed(2)}s`,
            }}
          />
        ))}
      </div>

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        title="Cancel recording / لغو ضبط"
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-200/70 hover:text-rose-800 active:scale-95 dark:text-rose-300 dark:hover:bg-rose-500/20"
      >
        <Trash size={16} />
      </button>
    </div>
  );
}
