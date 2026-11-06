import { describe, it, expect, vi, beforeEach } from "vitest";

describe("videoBackground module", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports getSelfieSegmenter and createVirtualBackgroundPipeline functions", async () => {
    const mod = await import("../../src/utils/videoBackground.js");
    expect(typeof mod.getSelfieSegmenter).toBe("function");
    expect(typeof mod.createVirtualBackgroundPipeline).toBe("function");
  });

  it("creates a virtual background pipeline and allows changing effects", async () => {
    const mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      filter: "none",
      globalCompositeOperation: "source-over",
    };

    const mockCanvas = {
      getContext: () => mockContext,
      captureStream: () => ({
        getVideoTracks: () => [{ id: "mock-processed-track", kind: "video" }],
      }),
      width: 640,
      height: 480,
    };

    global.document = {
      createElement: (tag) => {
        if (tag === "canvas") return mockCanvas;
        return {};
      },
    };
    global.requestAnimationFrame = vi.fn((cb) => 1);
    global.cancelAnimationFrame = vi.fn();

    const mod = await import("../../src/utils/videoBackground.js");

    const mockVideo = {
      videoWidth: 640,
      videoHeight: 480,
      readyState: 4,
    };

    const pipeline = mod.createVirtualBackgroundPipeline(mockVideo, "blur");
    expect(pipeline).toBeDefined();
    expect(typeof pipeline.setEffect).toBe("function");
    expect(typeof pipeline.stop).toBe("function");
    expect(pipeline.outputStream).toBeDefined();

    const [track] = pipeline.outputStream.getVideoTracks();
    expect(track.id).toBe("mock-processed-track");

    pipeline.setEffect("deep-blur");
    pipeline.setEffect("none");
    pipeline.stop();
  });
});
