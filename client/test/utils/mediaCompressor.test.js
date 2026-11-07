import { describe, test, expect, vi } from "vitest";
import {
  calculateDownscaleDimensions,
  formatFileSize,
  calculateSavingsPercent,
  IMAGE_QUALITY_PRESETS,
  VIDEO_QUALITY_PRESETS,
  compressImageFile,
  compressVideoFile,
} from "../../src/utils/mediaCompressor.js";

describe("mediaCompressor utility module", () => {
  describe("calculateDownscaleDimensions", () => {
    test("handles zero or negative dimensions safely", () => {
      expect(calculateDownscaleDimensions(0, 0)).toEqual({ width: 0, height: 0, scaled: false });
      expect(calculateDownscaleDimensions(-100, 500)).toEqual({ width: 0, height: 0, scaled: false });
    });

    test("does not scale down if image is within max bounds", () => {
      const res = calculateDownscaleDimensions(1200, 800, 1920);
      expect(res).toEqual({ width: 1200, height: 800, scaled: false });
    });

    test("scales landscape image down preserving aspect ratio", () => {
      const res = calculateDownscaleDimensions(3840, 2160, 1920);
      expect(res.scaled).toBe(true);
      expect(res.width).toBe(1920);
      expect(res.height).toBe(1080);
    });

    test("scales portrait image down preserving aspect ratio", () => {
      const res = calculateDownscaleDimensions(2000, 4000, 1000);
      expect(res.scaled).toBe(true);
      expect(res.width).toBe(500);
      expect(res.height).toBe(1000);
    });
  });

  describe("formatFileSize", () => {
    test("formats bytes, kilobytes, and megabytes properly", () => {
      expect(formatFileSize(500)).toBe("500 B");
      expect(formatFileSize(1024)).toBe("1.0 KB");
      expect(formatFileSize(350 * 1024)).toBe("350.0 KB");
      expect(formatFileSize(4.5 * 1024 * 1024)).toBe("4.5 MB");
    });
  });

  describe("calculateSavingsPercent", () => {
    test("returns 0 if compressed is larger or equal to original", () => {
      expect(calculateSavingsPercent(1000, 1200)).toBe(0);
      expect(calculateSavingsPercent(1000, 1000)).toBe(0);
      expect(calculateSavingsPercent(0, 500)).toBe(0);
    });

    test("calculates accurate percentage reduction", () => {
      expect(calculateSavingsPercent(1000, 500)).toBe(50);
      expect(calculateSavingsPercent(10000, 1000)).toBe(90);
    });
  });

  describe("IMAGE_QUALITY_PRESETS & VIDEO_QUALITY_PRESETS", () => {
    test("presets have required configuration keys", () => {
      expect(IMAGE_QUALITY_PRESETS.balanced).toBeDefined();
      expect(IMAGE_QUALITY_PRESETS.eco).toBeDefined();
      expect(IMAGE_QUALITY_PRESETS.original).toBeDefined();
      expect(VIDEO_QUALITY_PRESETS["720p"]).toBeDefined();
      expect(VIDEO_QUALITY_PRESETS["480p"]).toBeDefined();
      expect(VIDEO_QUALITY_PRESETS.original).toBeDefined();
    });
  });

  describe("compressImageFile", () => {
    test("bypasses compression when preset is original", async () => {
      const mockBlob = new Blob(["mock-image-data"], { type: "image/jpeg" });
      mockBlob.name = "photo.jpg";

      const res = await compressImageFile(mockBlob, { preset: "original" });
      expect(res.isCompressed).toBe(false);
      expect(res.file).toBe(mockBlob);
      expect(res.savingsPercent).toBe(0);
    });

    test("bypasses compression for GIF to preserve animation", async () => {
      const mockGif = new Blob(["mock-gif-data"], { type: "image/gif" });
      const res = await compressImageFile(mockGif, { preset: "balanced" });
      expect(res.isCompressed).toBe(false);
      expect(res.file).toBe(mockGif);
    });
  });

  describe("compressVideoFile", () => {
    test("bypasses transcoding when targetQuality is original and not muted", async () => {
      const mockVideo = new Blob(["mock-video-data"], { type: "video/mp4" });
      const res = await compressVideoFile(mockVideo, { targetQuality: "original", muteAudio: false });
      expect(res.isCompressed).toBe(false);
      expect(res.isMuted).toBe(false);
      expect(res.file).toBe(mockVideo);
    });
  });
});
