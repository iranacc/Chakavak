import { describe, test, expect } from "vitest";
import {
  searchGifs,
  getTrendingGifs,
  getStickerPacks,
  getStickerById,
} from "../lib/gifService.js";

describe("gifService library", () => {
  test("returns curated trending GIFs", async () => {
    const gifs = await getTrendingGifs(10);
    expect(Array.isArray(gifs)).toBe(true);
    expect(gifs.length).toBeGreaterThan(0);
    expect(gifs[0]).toHaveProperty("id");
    expect(gifs[0]).toHaveProperty("url");
    expect(gifs[0]).toHaveProperty("title");
  });

  test("searches GIFs matching query (Persian or English)", async () => {
    const resultsFa = await searchGifs({ query: "خنده", limit: 5 });
    expect(resultsFa.length).toBeGreaterThan(0);

    const resultsEn = await searchGifs({ query: "happy", limit: 5 });
    expect(resultsEn.length).toBeGreaterThan(0);
  });

  test("returns available sticker packs", () => {
    const packs = getStickerPacks();
    expect(Array.isArray(packs)).toBe(true);
    expect(packs.length).toBeGreaterThanOrEqual(4);

    const chakavakPack = packs.find((p) => p.id === "chakavak_mascot");
    expect(chakavakPack).toBeDefined();
    expect(chakavakPack.stickers.length).toBeGreaterThan(0);
  });

  test("fetches specific sticker by packId and stickerId", () => {
    const sticker = getStickerById("chakavak_mascot", "fly");
    expect(sticker).not.toBeNull();
    expect(sticker.title).toContain("پرواز");
    expect(sticker.packId).toBe("chakavak_mascot");
  });
});
