import { memo, useState } from "react";
import { Play, Pause } from "../../../icons/lucide.js";

export const GifCard = memo(function GifCard({
  gif,
  isOwn = false,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!gif) return null;

  const { title, url, previewUrl, width = 480, height = 270 } = gif;
  const aspectRatio = width && height ? `${width} / ${height}` : "16 / 9";

  return (
    <div
      className="relative my-1 max-w-[280px] overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-900 shadow-md sm:max-w-[320px] dark:border-slate-800"
      style={{ aspectRatio }}
    >
      {!isLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 animate-pulse text-xs text-slate-400">
          بارگذاری گیف...
        </div>
      ) : null}

      <img
        src={isPlaying ? url : previewUrl || url}
        alt={title || "GIF"}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* GIF Badge & Pause/Play toggle */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying((prev) => !prev);
          }}
          className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs backdrop-blur-md transition hover:bg-black/80"
          title={isPlaying ? "توقف متحرک‌سازی" : "پخش متحرک‌سازی"}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          <span>GIF</span>
        </button>
      </div>
    </div>
  );
});
