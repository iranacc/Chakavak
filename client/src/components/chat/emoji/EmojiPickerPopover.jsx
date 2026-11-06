import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { EMOJI_CATEGORIES } from "./emojiData.js";
import { Search, Close, Sparkles, LoaderCircle } from "../../../icons/lucide.js";
import { hasPersian } from "../../../utils/fontUtils.js";
import { fetchGifs, fetchStickerPacks } from "../../../api/chatApi.js";

const RECENT_STORAGE_KEY = "chakavak-recent-emojis";
const MAX_RECENT_EMOJIS = 24;

// Default built-in sticker packs fallback
const DEFAULT_STICKER_PACKS = [
  {
    id: "chakavak_mascot",
    name: "چکاوک و همراهان",
    nameEn: "Chakavak Mascot",
    icon: "🕊️",
    stickers: [
      { id: "fly", title: "پرواز چکاوک", emoji: "🕊️", symbol: "🕊️", gradient: "from-emerald-400 to-teal-500" },
      { id: "love", title: "محبت و عشق", emoji: "💖", symbol: "🕊️❤️", gradient: "from-rose-400 to-pink-500" },
      { id: "peace", title: "آرامش و صلح", emoji: "🌿", symbol: "🕊️🌿", gradient: "from-green-400 to-emerald-600" },
      { id: "work", title: "مشغول برنامه‌نویسی", emoji: "💻", symbol: "🕊️💻", gradient: "from-blue-400 to-indigo-600" },
      { id: "celebrate", title: "جشن و تبریک", emoji: "🎉", symbol: "🕊️🎉", gradient: "from-amber-400 to-orange-500" },
      { id: "thumbsup", title: "تأیید و عالی", emoji: "👍", symbol: "🕊️👍", gradient: "from-teal-400 to-emerald-500" },
      { id: "sing", title: "آواز خوش‌الحان", emoji: "🎵", symbol: "🕊️🎶", gradient: "from-violet-400 to-purple-600" },
      { id: "tea", title: "استراحت با چای", emoji: "☕", symbol: "🕊️☕", gradient: "from-amber-600 to-yellow-700" },
      { id: "idea", title: "ایده ناب و خلاقانه", emoji: "💡", symbol: "🕊️💡", gradient: "from-yellow-400 to-amber-500" },
      { id: "sleep", title: "شب‌بخیر و خواب", emoji: "🌙", symbol: "🕊️🌙", gradient: "from-slate-700 to-indigo-950" },
      { id: "rocket", title: "پرواز سریع به اوج", emoji: "🚀", symbol: "🕊️🚀", gradient: "from-sky-400 to-blue-600" },
      { id: "star", title: "درخشان و ستاره", emoji: "⭐", symbol: "🕊️⭐", gradient: "from-amber-300 to-yellow-500" },
    ],
  },
  {
    id: "cute_cat",
    name: "گربه‌های ملوس",
    nameEn: "Playful Kitties",
    icon: "🐱",
    stickers: [
      { id: "hi", title: "سلام گربه", emoji: "👋", symbol: "🐱👋", gradient: "from-amber-300 to-orange-400" },
      { id: "heart", title: "گربه عاشق", emoji: "😻", symbol: "😻💖", gradient: "from-pink-400 to-rose-500" },
      { id: "cry", title: "گریه و ناراحتی", emoji: "😿", symbol: "😿💧", gradient: "from-blue-300 to-cyan-500" },
      { id: "lol", title: "خنده از ته دل", emoji: "😹", symbol: "😹✨", gradient: "from-yellow-300 to-amber-500" },
      { id: "party", title: "پارتی و شادی", emoji: "🥳", symbol: "🐱🎉", gradient: "from-purple-400 to-pink-500" },
      { id: "cool", title: "گربه باحال عینکی", emoji: "😎", symbol: "😼🕶️", gradient: "from-slate-700 to-slate-900" },
      { id: "nom", title: "غذا خوردن شکمو", emoji: "🍕", symbol: "🐱🍕", gradient: "from-orange-400 to-red-500" },
      { id: "shock", title: "متعجب و شگفت‌زده", emoji: "🙀", symbol: "🙀‼️", gradient: "from-indigo-400 to-blue-600" },
    ],
  },
  {
    id: "persian_calligraphy",
    name: "خطاطی فارسی",
    nameEn: "Persian Words",
    icon: "✒️",
    stickers: [
      { id: "fa_salam", title: "سلام و ارادت", emoji: "🌸", symbol: "سلام و درود", gradient: "from-emerald-500 to-teal-700" },
      { id: "fa_khaste_nabashid", title: "خسته نباشید و خدا قوت", emoji: "💪", symbol: "خدا قوت 🌟", gradient: "from-amber-500 to-orange-600" },
      { id: "fa_dastmarizad", title: "دست مریزاد عالی بود", emoji: "👏", symbol: "دست مریزاد ✨", gradient: "from-blue-500 to-indigo-700" },
      { id: "fa_be_roye_cheshm", title: "به روی چشم", emoji: "👀", symbol: "به روی چشم 👍", gradient: "from-teal-500 to-emerald-700" },
      { id: "fa_rooze_khosh", title: "روزتون پربرکت و خوش", emoji: "☀️", symbol: "روز خوش ☀️", gradient: "from-yellow-500 to-amber-600" },
      { id: "fa_mokhelesim", title: "مخلصیم و ارادت", emoji: "🤝", symbol: "ارادتمندیم 🤝", gradient: "from-slate-600 to-slate-800" },
      { id: "fa_mobarak", title: "مبارک باشه", emoji: "🎉", symbol: "مبارک باشه 🎉", gradient: "from-pink-500 to-rose-600" },
      { id: "fa_damet_garm", title: "دمت گرم ایوالله", emoji: "🔥", symbol: "دمت گرم 🔥", gradient: "from-red-500 to-amber-600" },
    ],
  },
  {
    id: "hype_3d",
    name: "۳ بعدی و هایپ",
    nameEn: "3D Hype & Vibe",
    icon: "🔥",
    stickers: [
      { id: "fire", title: "آتشین و داغ", emoji: "🔥", symbol: "🔥", gradient: "from-orange-500 to-red-600" },
      { id: "100", title: "صد از صد نمره کامل", emoji: "💯", symbol: "💯", gradient: "from-red-500 to-pink-600" },
      { id: "diamond", title: "الماس ارزشمند", emoji: "💎", symbol: "💎", gradient: "from-cyan-400 to-blue-500" },
      { id: "bomb", title: "بمب انرژی", emoji: "💣", symbol: "💣", gradient: "from-slate-800 to-black" },
      { id: "trophy", title: "کاپ قهرمانی اول", emoji: "🏆", symbol: "🏆", gradient: "from-yellow-400 to-amber-600" },
      { id: "mindblown", title: "مغزم سوت کشید", emoji: "🤯", symbol: "🤯", gradient: "from-purple-500 to-indigo-600" },
      { id: "party", title: "جشن و هورا", emoji: "🎊", symbol: "🎊", gradient: "from-emerald-400 to-cyan-500" },
      { id: "magic", title: "جادویی و درخشان", emoji: "✨", symbol: "✨", gradient: "from-amber-300 to-purple-500" },
    ],
  },
];

const GIF_CATEGORIES = [
  { id: "all", label: "همه" },
  { id: "happy", label: "خوشحالی" },
  { id: "applause", label: "تشویق" },
  { id: "funny", label: "خنده" },
  { id: "celebrate", label: "جشن" },
  { id: "dance", label: "رقص" },
  { id: "love", label: "عشق" },
  { id: "work", label: "کار" },
];

export default function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelectEmoji,
  onSelectSticker,
  onSelectGif,
  anchorRef,
}) {
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const [pickerTab, setPickerTab] = useState("emoji"); // 'emoji' | 'sticker' | 'gif'
  const [activeCategoryId, setActiveCategoryId] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Stickers state
  const [stickerPacks, setStickerPacks] = useState(DEFAULT_STICKER_PACKS);
  const [activePackId, setActivePackId] = useState("chakavak_mascot");

  // GIFs state
  const [gifs, setGifs] = useState([]);
  const [activeGifCategory, setActiveGifCategory] = useState("all");
  const [isGifsLoading, setIsGifsLoading] = useState(false);

  const [recentEmojis, setRecentEmojis] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : ["❤️", "👍", "😂", "🔥", "😊", "🕊️", "👏", "🎉"];
    } catch {
      return ["❤️", "👍", "😂", "🔥", "😊", "🕊️", "👏", "🎉"];
    }
  });

  // Load sticker packs on mount
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    fetchStickerPacks()
      .then((res) => {
        if (isMounted && res?.packs?.length) {
          setStickerPacks(res.packs);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Load GIFs when GIF tab is opened or filters change
  useEffect(() => {
    if (!isOpen || pickerTab !== "gif") return;
    let isMounted = true;
    setIsGifsLoading(true);

    const timer = setTimeout(() => {
      fetchGifs({
        query: searchQuery,
        category: activeGifCategory === "all" ? "" : activeGifCategory,
        limit: 24,
      })
        .then((res) => {
          if (isMounted && Array.isArray(res?.gifs)) {
            setGifs(res.gifs);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsGifsLoading(false);
        });
    }, searchQuery ? 300 : 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, pickerTab, searchQuery, activeGifCategory]);

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
    onSelectEmoji?.(char);

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

  const handleStickerClick = (sticker) => {
    const fullSticker = {
      ...sticker,
      packId: activePackId,
    };
    onSelectSticker?.(fullSticker);
    onClose();
  };

  const handleGifClick = (gif) => {
    onSelectGif?.(gif);
    onClose();
  };

  // Filter emojis based on search query
  const searchResults = useMemo(() => {
    if (pickerTab !== "emoji") return null;
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
  }, [searchQuery, pickerTab]);

  const activeStickerPack = useMemo(() => {
    return (
      stickerPacks.find((p) => p.id === activePackId) || stickerPacks[0] || DEFAULT_STICKER_PACKS[0]
    );
  }, [stickerPacks, activePackId]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Emoji, Sticker, and GIF picker"
      className="absolute bottom-14 left-0 z-50 flex h-[410px] w-84 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-emerald-200/80 bg-white/95 shadow-2xl shadow-emerald-950/20 backdrop-blur-md sm:w-92 dark:border-emerald-500/30 dark:bg-slate-900/95 dark:shadow-black/50"
      style={{ animation: "popover-in 150ms cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      {/* Header & Main 3-Way Mode Switcher */}
      <div className="flex flex-col border-b border-emerald-100 p-2.5 pb-2 dark:border-slate-800">
        <div className="mb-2 flex rounded-xl bg-emerald-50/80 p-0.5 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => {
              setPickerTab("emoji");
              setSearchQuery("");
            }}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
              pickerTab === "emoji"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            ایموجی
          </button>
          <button
            type="button"
            onClick={() => {
              setPickerTab("sticker");
              setSearchQuery("");
            }}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
              pickerTab === "sticker"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            استیکر
          </button>
          <button
            type="button"
            onClick={() => {
              setPickerTab("gif");
              setSearchQuery("");
            }}
            className={`flex-1 rounded-lg py-1 text-center text-xs font-semibold transition ${
              pickerTab === "gif"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            گیف • GIF
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 text-slate-400 dark:text-slate-500"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              pickerTab === "gif"
                ? "Search GIFs / جستجوی گیف..."
                : pickerTab === "sticker"
                ? "Search stickers / استیکر..."
                : "Search emoji / جستجوی ایموجی..."
            }
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

        {/* Sub-bar based on active mode */}
        {pickerTab === "emoji" && !searchQuery ? (
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
        ) : pickerTab === "sticker" ? (
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {stickerPacks.map((pack) => {
              const isActive = activePackId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => setActivePackId(pack.id)}
                  title={pack.name}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold whitespace-nowrap transition ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800 shadow-xs dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{pack.icon}</span>
                  <span>{pack.name}</span>
                </button>
              );
            })}
          </div>
        ) : pickerTab === "gif" ? (
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
            {GIF_CATEGORIES.map((cat) => {
              const isActive = activeGifCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveGifCategory(cat.id)}
                  className={`rounded-lg px-2 py-0.5 text-xs font-medium whitespace-nowrap transition ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Main Content Area */}
      <div className="chat-scroll flex-1 overflow-y-auto p-2">
        {/* TAB 1: EMOJI */}
        {pickerTab === "emoji" ? (
          searchResults !== null ? (
            <div>
              <div className="mb-1.5 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                نتایج ({searchResults.length})
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
                </div>
              )}
            </div>
          ) : activeCategoryId === "recents" ? (
            <div>
              <div className="mb-1.5 px-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                اخیراً استفاده‌شده
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
          )
        ) : pickerTab === "sticker" ? (
          /* TAB 2: STICKERS */
          <div>
            <div className="mb-2 px-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {activeStickerPack.name} • کلیک برای ارسال مستقیم استیکر
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {activeStickerPack.stickers.map((stk) => (
                <button
                  key={stk.id}
                  type="button"
                  onClick={() => handleStickerClick(stk)}
                  className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs transition hover:scale-105 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm active:scale-95 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${
                      stk.gradient || "from-emerald-400 to-teal-500"
                    } text-xl shadow-xs`}
                  >
                    <span className="drop-shadow-xs">{stk.symbol || stk.emoji}</span>
                  </div>
                  <span
                    className="mt-1.5 max-w-full truncate text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                    dir="auto"
                  >
                    {stk.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* TAB 3: GIFS */
          <div>
            {isGifsLoading ? (
              <div className="flex h-40 flex-col items-center justify-center text-slate-400">
                <LoaderCircle className="animate-spin text-emerald-600" size={24} />
                <span className="mt-2 text-xs">در حال بارگذاری گیف‌ها...</span>
              </div>
            ) : gifs.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGifClick(g)}
                    className="group relative h-28 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900 shadow-2xs transition hover:scale-102 hover:border-emerald-400 hover:shadow-md active:scale-95 dark:border-slate-800"
                  >
                    <img
                      src={g.previewUrl || g.url}
                      alt={g.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-right">
                      <span className="block truncate text-[10px] font-medium text-white" dir="auto">
                        {g.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
                <span>گیف یافت نشد</span>
                <span className="mt-1 text-[10px]">کلمه دیگری جستجو کنید</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Branding Bar */}
      <div className="flex items-center justify-between border-t border-emerald-100/70 px-3 py-1.5 text-[10px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">چکاوک • استیکر و گیف</span>
        <span>
          {pickerTab === "emoji"
            ? "کلیک برای درج ایموجی"
            : pickerTab === "sticker"
            ? "کلیک برای ارسال استیکر"
            : "کلیک برای ارسال گیف"}
        </span>
      </div>
    </div>
  );
}
