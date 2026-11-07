/**
 * Video Background Processing Engine
 * Provides Background Blur and Virtual Background replacement using
 * self-hosted MediaPipe Selfie Segmentation and Canvas WebGL/2D composition.
 */

let segmenterInstance = null;
let segmenterLoadingPromise = null;

export async function getSelfieSegmenter() {
  if (segmenterInstance) return segmenterInstance;
  if (segmenterLoadingPromise) return segmenterLoadingPromise;

  segmenterLoadingPromise = (async () => {
    try {
      if (typeof window !== "undefined" && !window.SelfieSegmentation) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "/mediapipe/selfie_segmentation.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = (e) => reject(new Error("Failed to load /mediapipe/selfie_segmentation.js"));
          document.head.appendChild(s);
        });
      }

      const SelfieSegmentation = typeof window !== "undefined" ? window.SelfieSegmentation : null;
      if (!SelfieSegmentation) {
        throw new Error("SelfieSegmentation constructor not found on window");
      }
      const segmenter = new SelfieSegmentation({
        locateFile: (file) => `/mediapipe/${file}`,
      });
      segmenter.setOptions({
        modelSelection: 1, // 1 for landscape (ultra-fast 144x256 for realtime video calls)
        selfieMode: false, // Keep original camera orientation
      });
      await segmenter.initialize();
      segmenterInstance = segmenter;
      return segmenter;
    } catch (err) {
      console.error("Could not load MediaPipe Selfie Segmentation:", err);
      segmenterLoadingPromise = null;
      throw err;
    }
  })();

  return segmenterLoadingPromise;
}

/**
 * Creates a processed MediaStreamTrack from a raw camera video stream.
 * @param {HTMLVideoElement} sourceVideo - Hidden playing video element
 * @param {string} initialEffect - "none" | "blur" | "deep-blur" | "image"
 * @param {HTMLImageElement|null} initialBgImage - Optional background image
 * @returns {{ outputStream: MediaStream, stop: Function, setEffect: Function }}
 */
export function createVirtualBackgroundPipeline(sourceVideo, initialEffect = "blur", initialBgImage = null) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let currentEffect = initialEffect;
  let bgImage = initialBgImage;
  let isRunning = true;
  let animFrameId = null;
  let isProcessing = false;

  canvas.width = sourceVideo.videoWidth || 640;
  canvas.height = sourceVideo.videoHeight || 480;

  let segmenter = null;
  getSelfieSegmenter()
    .then((s) => {
      segmenter = s;
      if (segmenter) {
        segmenter.onResults(onResults);
      }
    })
    .catch((err) => {
      console.warn("MediaPipe segmenter initialization warning:", err);
    });

  function onResults(results) {
    if (!isRunning || !ctx) return;
    const { width, height } = canvas;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (currentEffect === "none") {
      ctx.drawImage(results.image, 0, 0, width, height);
      ctx.restore();
      return;
    }

    try {
      // 1. Draw the segmentation mask first as the clipping stencil
      ctx.drawImage(results.segmentationMask, 0, 0, width, height);

      // 2. Keep ONLY the person pixels inside the mask using source-in
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(results.image, 0, 0, width, height);

      // 3. Draw blurred background BEHIND the person using destination-over
      ctx.globalCompositeOperation = "destination-over";
      if (currentEffect === "deep-blur") {
        ctx.filter = "blur(24px)";
      } else if (currentEffect === "blur") {
        ctx.filter = "blur(12px)";
      } else if (currentEffect === "image" && bgImage) {
        ctx.filter = "none";
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.filter = "blur(12px)";
      }

      if (currentEffect !== "image" || !bgImage) {
        ctx.drawImage(results.image, 0, 0, width, height);
      }
    } catch (err) {
      console.warn("onResults composition error:", err);
      // Fallback in case of rendering error
      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(results.image, 0, 0, width, height);
    }

    ctx.restore();
  }

  async function processFrame() {
    if (!isRunning) return;

    if (sourceVideo.paused && sourceVideo.srcObject) {
      sourceVideo.play().catch(() => {});
    }

    if (sourceVideo.readyState >= 2) {
      if (sourceVideo.videoWidth > 0 && sourceVideo.videoHeight > 0) {
        if (canvas.width !== sourceVideo.videoWidth || canvas.height !== sourceVideo.videoHeight) {
          canvas.width = sourceVideo.videoWidth;
          canvas.height = sourceVideo.videoHeight;
        }
      }

      if (segmenter && !isProcessing && currentEffect !== "none") {
        isProcessing = true;
        try {
          await segmenter.send({ image: sourceVideo });
        } catch (err) {
          console.warn("segmenter.send error:", err);
          if (ctx) {
            ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
          }
        } finally {
          isProcessing = false;
        }
      } else if (!segmenter || currentEffect === "none") {
        if (ctx) {
          ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
        }
      }
    }

    if (isRunning) {
      animFrameId = requestAnimationFrame(processFrame);
    }
  }

  processFrame();

  const outputStream = canvas.captureStream(30);

  return {
    outputStream,
    setEffect: (effect, image = null) => {
      currentEffect = effect;
      if (image) bgImage = image;
    },
    stop: () => {
      isRunning = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
    },
  };
}
