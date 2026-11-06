import { memo, useEffect, useState } from "react";
import { ExternalLink, Globe } from "../../../icons/lucide.js";
import { fetchLinkPreview } from "../../../api/chatApi.js";

// Session-level in-memory cache for fast display
const CLIENT_PREVIEW_CACHE = new Map();

export const LinkPreviewCard = memo(function LinkPreviewCard({ url, isOwn }) {
  const [preview, setPreview] = useState(() => CLIENT_PREVIEW_CACHE.get(url) || null);
  const [loading, setLoading] = useState(() => !CLIENT_PREVIEW_CACHE.has(url));

  useEffect(() => {
    if (!url) return;
    if (CLIENT_PREVIEW_CACHE.has(url)) {
      setPreview(CLIENT_PREVIEW_CACHE.get(url));
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    fetchLinkPreview(url)
      .then((res) => {
        if (!res.ok) throw new Error("Preview not available");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data?.preview) {
          CLIENT_PREVIEW_CACHE.set(url, data.preview);
          setPreview(data.preview);
        } else {
          CLIENT_PREVIEW_CACHE.set(url, null);
        }
      })
      .catch(() => {
        if (active) {
          CLIENT_PREVIEW_CACHE.set(url, null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [url]);

  if (loading || !preview) return null;

  let hostname = "";
  try {
    hostname = new URL(preview.url || url).hostname;
  } catch {}

  return (
    <a
      href={preview.url || url}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 block overflow-hidden rounded-xl border text-start transition duration-150 hover:opacity-95 ${
        isOwn
          ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-950 dark:border-emerald-400/20 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-slate-200/80 bg-slate-50/80 text-slate-900 dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {preview.image ? (
        <div className="relative aspect-video w-full overflow-hidden bg-black/5 dark:bg-white/5">
          <img
            src={preview.image}
            alt={preview.title || "Preview image"}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.parentElement.style.display = "none";
            }}
          />
        </div>
      ) : null}

      <div className="p-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Globe size={12} className="shrink-0" />
          <span className="truncate">{preview.siteName || hostname}</span>
          <ExternalLink size={10} className="shrink-0 ms-auto opacity-60" />
        </div>

        {preview.title ? (
          <div className="mt-1 line-clamp-1 text-xs font-semibold">
            {preview.title}
          </div>
        ) : null}

        {preview.description ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] opacity-75">
            {preview.description}
          </p>
        ) : null}
      </div>
    </a>
  );
});
