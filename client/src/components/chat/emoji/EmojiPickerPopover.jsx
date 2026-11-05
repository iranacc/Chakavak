import { useState, useEffect, useRef, useMemo } from "react";
import { EMOJI_CATEGORIES } from "./emojiData.js";
import { Search, Close, Sparkles } from "../../../icons/lucide.js";
import { hasPersian } from "../../../utils/fontUtils.js";

const RECENT_STORAGE_KEY = "chakavak-recent-emojis";
const MAX_RECENT_EMOJIS = 24;

export default function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelectEmoji,
  anchorRef,
}) {
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const [pickerTab, setPickerTab] = useState("emoji"); // 'emoji' | 'sticker'
  const [activeCategoryId, setActiveCategoryId] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : ["❤️", "👍", "😂", "🔥", "😊", "🕊️", "👏", "🎉"];
    } catch {
      return ["❤️", "👍", "😂", "🔥", "😊", "🕊️", "👏", "🎉"];
    }
  });

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        !anchorRef?.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleEmojiClick = (char) => {
    onSelectEmoji(char);

    // Save to recents
    setRecentEmojis((prev) => {
      const filtered = prev.filter((item) => item !== char);
      const updated = [char, ...filtered].slice(0, MAX_RECENT_EMOJIS);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Filter emojis based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matched = [];
    const seen = new Set();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.char)) continue;
        const matchesQuery = item.keywords.some((k) =>
          k.toLowerCase().includes(q)
        );
        if (matchesQuery) {
          seen.add(item.char);
          matched.push(item);
        }
      }
    }
    return matched;
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Emoji picker"
      className="absolute bottom-14 left-0 z-50 flex h-96 w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-2xl shadow-emerald-950/20 backdrop-blur-md sm:w-88 dark:border-emerald-500/30 dark:bg-slate-900/95 dark:shadow-black/50"
      style={{ animation: "popover-in 150ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Header & Mode Switcher */}
      <div className="flex flex-col border-b border-emerald-100 p-2.5 pb-2 dark:border-slate-800">
        <div className="mb-2 flex rounded-xl bg-emerald-50/80 p-0.5 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setPickerTab("emoji")}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
              pickerTab === "emoji"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            ایموجی • Emoji
          </button>
          <button
            type="button"
            onClick={() => setPickerTab("sticker")}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
              pickerTab === "sticker"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            استیکر • Sticker
          </button>
        </div>

        <div className="relative flex items-center">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search emoji / جستجوی ایموجی..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-emerald-200/60 bg-emerald-50/50 py-1.5 pr-8 pl-9 text-xs text-slate-800 placeholder-slate-400 outline-hidden transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-300/40 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-500/60 dark:focus:bg-slate-800"
            dir="auto"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              aria-label="Clear search"
            >
              <Close size={12} />
            </button>
          ) : null}
        </div>

        {/* Category Tabs (hidden during active search) */}
        {!searchQuery ? (
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {recentEmojis.length > 0 ? (
              <button
                type="button"
                onClick={() => setActiveCategoryId("recents")}
                title="Recently used"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                  activeCategoryId === "recents"
                    ? "bg-emerald-100 text-emerald-800 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
              </button>
            ) : null}

            {EMOJI_CATEGORIES.map((cat) => {
              const isActive = activeCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  title={cat.nameFa}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="scale-90">{cat.icon}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Emoji Scrollable View */}
      <div className="chat-scroll flex-1 overflow-y-auto p-2">
        {pickerTab === "sticker" ? (
          <div className="space-y-3 p-1">
            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                پیام‌های سریع و استیکری • Quick Stickers
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2">
                {[
                  "سلام علیکم 👋",
                  "خیلی ممنون 🙏",
                  "عالی و پرقدرت 💪",
                  "درود و احترام 🕊️",
                  "موفق باشی رفیق 🚀",
                  "خسته نباشی خداقوت 🌟",
                  "تبریک فراوان 🎉",
                  "حتماً، به روی چشم 👍",
                  "شب شما خوش 🌙",
                  "روزتون پربرکت ☀️",
                  "دست مریزاد عالی بود ✨",
                  "بی‌نظیره 👌",
                ].map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => {
                      onSelectEmoji(text);
                      onClose();
                    }}
                    className="flex items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-2.5 py-2 text-xs font-semibold text-emerald-900 shadow-2xs transition hover:scale-[1.02] hover:bg-emerald-100 hover:shadow-xs active:scale-95 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                    dir="auto"
                  >
                    <span className="truncate">{text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 px-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ری‌اکشن‌های ویژه • Expressive Badges
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { icon: "🕊️", label: "چکاوک" },
                  { icon: "🔥", label: "آتشین" },
                  { icon: "💖", label: "محبت" },
                  { icon: "🚀", label: "پرواز" },
                  { icon: "🌟", label: "درخشان" },
                  { icon: "🎉", label: "جشن" },
                  { icon: "💯", label: "عالی" },
                  { icon: "☕", label: "استراحت" },
                  { icon: "🏆", label: "برنده" },
                  { icon: "🎯", label: "دقیق" },
                  { icon: "👏", label: "تشویق" },
                  { icon: "⚡", label: "سریع" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onSelectEmoji(item.icon);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs transition hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-xs active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : searchResults !== null ? (
          <div>
            <div className="mb-1.5 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Results ({searchResults.length})
            </div>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-7 gap-1 sm:grid-cols-8">
                {searchResults.map((item) => (
                  <button
                    key={item.char}
                    type="button"
                    onClick={() => handleEmojiClick(item.char)}
                    title={item.keywords.join(", ")}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:scale-125 hover:bg-emerald-100/70 active:scale-95 dark:hover:bg-emerald-500/20"
                  >
                    {item.char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
                <span>ایموجی یافت نشد</span>
                <span className="mt-1 text-[10px]">No emojis matched your query</span>
              </div>
            )}
          </div>
        ) : activeCategoryId === "recents" ? (
          <div>
            <div className="mb-1.5 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              اخیراً استفاده‌شده / Recent
            </div>
            <div className="grid grid-cols-7 gap-1 sm:grid-cols-8">
              {recentEmojis.map((char, index) => (
                <button
                  key={`${char}-${index}`}
                  type="button"
                  onClick={() => handleEmojiClick(char)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:scale-125 hover:bg-emerald-100/70 active:scale-95 dark:hover:bg-emerald-500/20"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        ) : (
          (() => {
            const currentCat = EMOJI_CATEGORIES.find(
              (c) => c.id === activeCategoryId
            );
            if (!currentCat) return null;
            return (
              <div>
                <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{currentCat.nameFa}</span>
                  <span className="text-[10px] opacity-70">{currentCat.nameEn}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:grid-cols-8">
                  {currentCat.emojis.map((item) => (
                    <button
                      key={item.char}
                      type="button"
                      onClick={() => handleEmojiClick(item.char)}
                      title={item.keywords.join(", ")}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-xl transition hover:scale-125 hover:bg-emerald-100/70 active:scale-95 dark:hover:bg-emerald-500/20"
                    >
                      {item.char}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Footer Branding subtle bar */}
      <div className="flex items-center justify-between border-t border-emerald-100/70 px-3 py-1.5 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">چکاوک • Chakavak</span>
        <span>کلیک برای درج ایموجی</span>
      </div>
    </div>
  );
}
