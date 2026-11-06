/**
 * Utility for parsing and formatting rich special message payloads
 * such as Stickers and GIFs.
 */

export function parseSpecialMessage(body) {
  if (!body || typeof body !== "string") return null;
  const trimmed = body.trim();
  if (
    trimmed.startsWith('{"type":"sticker"') ||
    trimmed.startsWith('{"type":"gif"') ||
    trimmed.startsWith('{"type": "sticker"') ||
    trimmed.startsWith('{"type": "gif"')
  ) {
    try {
      const data = JSON.parse(trimmed);
      if (data && (data.type === "sticker" || data.type === "gif")) {
        return data;
      }
    } catch {
      return null;
    }
  }
  return null;
}

export function formatStickerMessage(sticker) {
  return JSON.stringify({
    type: "sticker",
    packId: sticker.packId || "chakavak_mascot",
    stickerId: sticker.id,
    title: sticker.title || "",
    emoji: sticker.emoji || "🕊️",
    symbol: sticker.symbol || "",
    gradient: sticker.gradient || "from-emerald-400 to-teal-500",
  });
}

export function formatGifMessage(gif) {
  return JSON.stringify({
    type: "gif",
    id: gif.id,
    title: gif.title || "GIF",
    url: gif.url,
    previewUrl: gif.previewUrl || gif.url,
    width: gif.width || 480,
    height: gif.height || 270,
  });
}
