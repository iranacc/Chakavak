import { describe, test, expect } from "vitest";
import request from "supertest";
import { makeApp } from "./helpers/makeApp.js";

describe("GIFs & Sticker Packs API endpoints", () => {
  test("GET /api/messages/gifs returns list of GIFs", async () => {
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "gif_tester" }),
      },
    });

    const res = await request(appObj.app).get("/api/messages/gifs?q=happy&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.gifs)).toBe(true);
    expect(res.body.gifs.length).toBeGreaterThan(0);
  });

  test("GET /api/messages/stickers/packs returns available sticker packs", async () => {
    const appObj = makeApp({
      deps: {
        requireSession: () => ({ id: "u1", username: "sticker_tester" }),
      },
    });

    const res = await request(appObj.app).get("/api/messages/stickers/packs");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.packs)).toBe(true);
    expect(res.body.packs.some((p) => p.id === "chakavak_mascot")).toBe(true);
  });
});
