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

  it("rejects getSelfieSegmenter when the model fails to initialize so callers can revert", async () => {
    class FailingSegmenter {
      setOptions() {}
      initialize() { return Promise.reject(new Error("model load failed")); }
      onResults() {}
    }
    global.window = { SelfieSegmentation: FailingSegmenter };
    global.document = { createElement: () => ({}), head: { appendChild: () => {} } };
    vi.spyOn(console, "error").mockImplementation(() => {});

    const mod = await import("../../src/utils/videoBackground.js");

    await expect(mod.getSelfieSegmenter()).rejects.toThrow("model load failed");
    vi.restoreAllMocks();
  });

  it("applies correct compositing order (mask stencil -> source-in -> destination-over blur)", async () => {
    let capturedOnResults = null;
    class MockSegmenter {
      setOptions() {}
      initialize() { return Promise.resolve(); }
      onResults(cb) { capturedOnResults = cb; }
      send() { return Promise.resolve(); }
    }
    global.window = {
      SelfieSegmentation: MockSegmenter,
    };

    const drawCalls = [];
    const mockContext = {
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn((img) => drawCalls.push({ img, op: mockContext.globalCompositeOperation, filter: mockContext.filter })),
      filter: "none",
      globalCompositeOperation: "source-over",
    };

    const mockCanvas = {
      getContext: () => mockContext,
      captureStream: () => ({
        getVideoTracks: () => [{ id: "track-1" }],
      }),
      width: 640,
      height: 480,
    };

    global.document = {
      createElement: () => mockCanvas,
    };
    global.requestAnimationFrame = vi.fn();
    global.cancelAnimationFrame = vi.fn();

    const mod = await import("../../src/utils/videoBackground.js");
    const mockVideo = { videoWidth: 640, videoHeight: 480, readyState: 4 };

    const pipeline = mod.createVirtualBackgroundPipeline(mockVideo, "blur");
    await new Promise((r) => setTimeout(r, 10));

    expect(capturedOnResults).toBeDefined();
    drawCalls.length = 0;

    const mockResults = {
      image: "crisp-webcam-image",
      segmentationMask: "person-stencil-mask",
    };

    capturedOnResults(mockResults);

    // Call 1: Draw mask
    expect(drawCalls[0].img).toBe("person-stencil-mask");
    // Call 2: Draw person with source-in
    expect(drawCalls[1].img).toBe("crisp-webcam-image");
    expect(drawCalls[1].op).toBe("source-in");
    // Call 3: Draw blurred background with destination-over and blur filter
    expect(drawCalls[2].img).toBe("crisp-webcam-image");
    expect(drawCalls[2].op).toBe("destination-over");
    expect(drawCalls[2].filter).toBe("blur(12px)");

    pipeline.stop();
  });
});
