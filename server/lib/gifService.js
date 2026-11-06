/**
 * GIF & Sticker Catalog Service for چکاوک (Chakavak)
 *
 * Provides searchable GIFs (with caching and curated offline fallbacks)
 * and rich vector/illustrated Sticker Packs.
 */

// In-memory cache for GIF searches (1 hour TTL)
const GIF_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

// Curated high quality GIF dataset (rich animated WebP & GIFs hosted on reliable CDNs)
export const CURATED_GIFS = [
  {
    id: "gif_happy_dog",
    title: "Happy Excited Pup",
    tags: ["happy", "خوشحال", "شادی", "سگ", "dog", "excited", "love"],
    category: "happy",
    url: "https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif",
    previewUrl: "https://media.giphy.com/media/blSTtZehjAZ8I/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_applause_leonardo",
    title: "Great Gatsby Toast & Cheers",
    tags: ["applause", "تشویق", "آفرین", "cheers", "celebrate", "تبریک", "عالی"],
    category: "applause",
    url: "https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif",
    previewUrl: "https://media.giphy.com/media/GCLlQnV7dXZ2E/200w.gif",
    width: 500,
    height: 281,
  },
  {
    id: "gif_lol_laughing_cat",
    title: "Laughing Cat LOL",
    tags: ["laugh", "خنده", "lol", "hahaha", "cat", "گربه", "funny", "طنز"],
    category: "funny",
    url: "https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif",
    previewUrl: "https://media.giphy.com/media/mlvseq9yvZhba/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_dance_baby_groot",
    title: "Dancing Baby Groot",
    tags: ["dance", "رقص", "party", "موزیک", "شادی", "groot", "cute"],
    category: "dance",
    url: "https://media.giphy.com/media/10ECejStvoJVVC/giphy.gif",
    previewUrl: "https://media.giphy.com/media/10ECejStvoJVVC/200w.gif",
    width: 500,
    height: 281,
  },
  {
    id: "gif_thumbs_up_terminator",
    title: "Terminator Thumbs Up",
    tags: ["thumbs up", "تأیید", "عالی", "agree", "yes", "بله", "اوکی", "ok"],
    category: "thumbs up",
    url: "https://media.giphy.com/media/7TtvTUMm9mp20/giphy.gif",
    previewUrl: "https://media.giphy.com/media/7TtvTUMm9mp20/200w.gif",
    width: 500,
    height: 281,
  },
  {
    id: "gif_mind_blown",
    title: "Mind Blown Galaxy",
    tags: ["mind blown", "شگفت‌انگیز", "برگ‌ریزون", "shock", "wow", "عجیب"],
    category: "reactions",
    url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
    previewUrl: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif",
    width: 480,
    height: 270,
  },
  {
    id: "gif_clapping_friends",
    title: "Friends Clapping Applause",
    tags: ["clapping", "دست", "تشویق", "applause", "احسنت", "bravo"],
    category: "applause",
    url: "https://media.giphy.com/media/nbvFVPiEiJH6Q/giphy.gif",
    previewUrl: "https://media.giphy.com/media/nbvFVPiEiJH6Q/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_love_heart_bear",
    title: "Cute Love Bear Heart",
    tags: ["love", "عشق", "محبت", "قلب", "heart", "cute", "kiss", "بوس"],
    category: "love",
    url: "https://media.giphy.com/media/L0O3TQpp0WnSXmxV8p/giphy.gif",
    previewUrl: "https://media.giphy.com/media/L0O3TQpp0WnSXmxV8p/200w.gif",
    width: 400,
    height: 400,
  },
  {
    id: "gif_party_confetti",
    title: "Party Confetti Celebration",
    tags: ["party", "جشن", "تولد", "تبریک", "celebrate", "happy", "شادی"],
    category: "celebrate",
    url: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif",
    previewUrl: "https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif",
    width: 480,
    height: 270,
  },
  {
    id: "gif_typing_cat_fast",
    title: "Cat Typing on Keyboard Fast",
    tags: ["cat", "کار", "کد", "برنامه‌نویسی", "typing", "work", "خسته نباشید"],
    category: "work",
    url: "https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif",
    previewUrl: "https://media.giphy.com/media/unQ3IJU2RG7DO/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_nodding_yes",
    title: "Nodding Yes Agree",
    tags: ["yes", "بله", "موافقم", "agree", "nod", "حتما"],
    category: "reactions",
    url: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif",
    previewUrl: "https://media.giphy.com/media/NEvPzZ8bd1V4Y/200w.gif",
    width: 480,
    height: 270,
  },
  {
    id: "gif_crying_baby",
    title: "Crying Tear Baby",
    tags: ["cry", "گریه", "اشک", "sad", "ناراحت", "غم"],
    category: "reactions",
    url: "https://media.giphy.com/media/L95W4wvxxB1NW/giphy.gif",
    previewUrl: "https://media.giphy.com/media/L95W4wvxxB1NW/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_facepalm_picard",
    title: "Captain Picard Facepalm",
    tags: ["facepalm", "وای", "وای خدا", "omg", "disappointed"],
    category: "reactions",
    url: "https://media.giphy.com/media/XsUtdIeJ0MWMo/giphy.gif",
    previewUrl: "https://media.giphy.com/media/XsUtdIeJ0MWMo/200w.gif",
    width: 480,
    height: 360,
  },
  {
    id: "gif_bird_dance",
    title: "Cockatoo Head Bobbing Dance",
    tags: ["bird", "پرنده", "چکاوک", "dance", "رقص", "happy", "party"],
    category: "dance",
    url: "https://media.giphy.com/media/l3q2t2KAyvxy9xBe0/giphy.gif",
    previewUrl: "https://media.giphy.com/media/l3q2t2KAyvxy9xBe0/200w.gif",
    width: 480,
    height: 270,
  },
];

// Rich Curated Sticker Packs
export const STICKER_PACKS = [
  {
    id: "chakavak_mascot",
    name: "چکاوک و همراهان",
    nameEn: "Chakavak Mascot",
    icon: "🕊️",
    description: "استیکرهای نمادین و دوست‌داشتنی پرنده چکاوک",
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
    description: "استیکرهای شیرین و خنده‌دار گربه‌ها",
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
    name: "خطاطی و تعارفات فارسی",
    nameEn: "Persian Words",
    icon: "✒️",
    description: "عبارات پرکاربرد و اصیل فارسی با طراحی تایپوگرافی زیبا",
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
    description: "ری‌اکشن‌های سه‌بعدی پرانرژی و جذاب",
    stickers: [
      { id: "fire", title: "آتشین و فوق‌العاده", emoji: "🔥", symbol: "🔥", gradient: "from-orange-500 to-red-600" },
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

/**
 * Searches curated GIFs or queries external API if configured.
 */
export async function searchGifs({ query = "", category = "", limit = 20 }) {
  const qClean = String(query || "").trim().toLowerCase();
  const catClean = String(category || "").trim().toLowerCase();

  const cacheKey = `search:${qClean}:${catClean}:${limit}`;
  const cached = GIF_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let results = [...CURATED_GIFS];

  if (catClean && catClean !== "all") {
    results = results.filter((g) => g.category.toLowerCase() === catClean);
  }

  if (qClean) {
    results = results.filter((g) => {
      const matchTitle = g.title.toLowerCase().includes(qClean);
      const matchTags = g.tags.some((tag) => tag.toLowerCase().includes(qClean));
      return matchTitle || matchTags;
    });
  }

  // If no match found and query was specific, fall back to matching any word
  if (results.length === 0 && qClean) {
    const tokens = qClean.split(/\s+/).filter(Boolean);
    results = CURATED_GIFS.filter((g) =>
      tokens.some(
        (tok) =>
          g.title.toLowerCase().includes(tok) ||
          g.tags.some((t) => t.toLowerCase().includes(tok)),
      ),
    );
  }

  // Default fallback if still empty
  if (results.length === 0) {
    results = CURATED_GIFS.slice(0, limit);
  }

  const finalGifs = results.slice(0, limit);

  // Cache result
  if (GIF_CACHE.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = GIF_CACHE.keys().next().value;
    if (oldestKey) GIF_CACHE.delete(oldestKey);
  }
  GIF_CACHE.set(cacheKey, { timestamp: Date.now(), data: finalGifs });

  return finalGifs;
}

/**
 * Returns trending GIFs.
 */
export async function getTrendingGifs(limit = 20) {
  return searchGifs({ query: "", limit });
}

/**
 * Returns all available sticker packs.
 */
export function getStickerPacks() {
  return STICKER_PACKS;
}

/**
 * Retrieves a specific sticker by packId and stickerId.
 */
export function getStickerById(packId, stickerId) {
  const pack = STICKER_PACKS.find((p) => p.id === packId);
  if (!pack) return null;
  const sticker = pack.stickers.find((s) => s.id === stickerId);
  if (!sticker) return null;
  return {
    ...sticker,
    packId: pack.id,
    packName: pack.name,
  };
}
