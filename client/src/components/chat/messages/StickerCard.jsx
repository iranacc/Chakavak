import { memo } from "react";
import Tooltip from "../../common/Tooltip.jsx";

export const StickerCard = memo(function StickerCard({
  sticker,
  isOwn = false,
}) {
  if (!sticker) return null;

  const { title, emoji, symbol, gradient, stickerId, packId } = sticker;

  return (
    <Tooltip label={title || "استیکر"} asChild>
      <div
        className="group relative my-1 inline-flex select-none items-center justify-center p-1 transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
        role="img"
        aria-label={title || "Sticker"}
      >
        <div
          className={`relative flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br ${
            gradient || "from-emerald-400 to-teal-500"
          } p-3 shadow-lg shadow-emerald-950/15 ring-2 ring-white/60 transition group-hover:shadow-xl dark:ring-white/20`}
        >
          {/* Inner glass layer */}
          <div className="absolute inset-1 rounded-2xl bg-white/20 backdrop-blur-xs transition group-hover:bg-white/30" />

          {/* Central sticker graphic/symbol */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {symbol ? (
              <span className="text-4xl drop-shadow-md sm:text-5xl">
                {symbol}
              </span>
            ) : emoji ? (
              <span className="text-5xl drop-shadow-md">{emoji}</span>
            ) : (
              <span className="text-4xl">🕊️</span>
            )}
            {title ? (
              <span
                className="mt-1.5 max-w-[120px] truncate rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-bold text-white shadow-xs backdrop-blur-md"
                dir="auto"
              >
                {title}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Tooltip>
  );
});
