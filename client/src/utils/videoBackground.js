/**
 * Video Background Processing Engine
 * Provides Background Blur and Virtual Background replacement using
 * client-side MediaPipe Selfie Segmentation and Canvas WebGL/2D composition.
 */

let segmenterInstance = null;
let segmenterLoadingPromise = null;

export async function getSelfieSegmenter() {
  if (segmenterInstance) return segmenterInstance;
  if (segmenterLoadingPromise) return segmenterLoadingPromise;

  segmenterLoadingPromise = (async () => {
    try {
      const module = await import("@mediapipe/selfie_segmentation");
      const SelfieSegmentation = module.SelfieSegmentation || module.default?.SelfieSegmentation || window.SelfieSegmentation;
      if (!SelfieSegmentation) {
        throw new Error("SelfieSegmentation constructor not found");
      }
      const segmenter = new SelfieSegmentation({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });
      segmenter.setOptions({
        modelSelection: 1, // 0 for general landscape, 1 for close-up selfies
        selfieMode: true,
      });
      await segmenter.initialize();
      segmenterInstance = segmenter;
      return segmenter;
    } catch (err) {
      console.warn("Could not load MediaPipe Selfie Segmentation:", err);
      segmenterLoadingPromise = null;
      throw err;
    }
  })();

  return segmenterLoadingPromise;
}

/**
 * Creates a processed MediaStreamTrack from a raw camera video stream.
 * @param {HTMLVideoElement} sourceVideo - Hidden playing video element
 * @param {string} effect - "none" | "blur" | "deep-blur" | "image"
 * @param {HTMLImageElement|null} customBgImage - Optional background image
 * @returns {{ outputStream: MediaStream, stop: Function, setEffect: Function }}
 */
export function createVirtualBackgroundPipeline(sourceVideo, initialEffect = "blur", initialBgImage = null) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let currentEffect = initialEffect;
  let bgImage = initialBgImage;
  let isRunning = true;
  let animFrameId = null;

  canvas.width = sourceVideo.videoWidth || 640;
  canvas.height = sourceVideo.videoHeight || 480;

  let segmenter = null;
  getSelfieSegmenter().then((s) => {
    segmenter = s;
    if (segmenter) {
      segmenter.onResults(onResults);
    }
  }).catch(() => {});

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

    // 1. Draw Background (blurred or virtual image)
    if (currentEffect === "blur") {
      ctx.filter = "blur(14px)";
      ctx.drawImage(results.image, 0, 0, width, height);
    } else if (currentEffect === "deep-blur") {
      ctx.filter = "blur(28px)";
      ctx.drawImage(results.image, 0, 0, width, height);
    } else if (currentEffect === "image" && bgImage) {
      ctx.filter = "none";
      ctx.drawImage(bgImage, 0, 0, width, height);
    } else {
      ctx.filter = "blur(14px)";
      ctx.drawImage(results.image, 0, 0, width, height);
    }
    ctx.filter = "none";

    // 2. Cut out person mask
    ctx.globalCompositeOperation = "destination-atop";
    ctx.drawImage(results.segmentationMask, 0, 0, width, height);

    // 3. Draw person back in foreground
    ctx.globalCompositeOperation = "destination-over";
    ctx.drawImage(results.image, 0, 0, width, height);

    ctx.restore();
  }

  async function processFrame() {
    if (!isRunning) return;
    if (sourceVideo.readyState >= 2 && segmenter) {
      if (canvas.width !== sourceVideo.videoWidth || canvas.height !== sourceVideo.videoHeight) {
        if (sourceVideo.videoWidth > 0 && sourceVideo.videoHeight > 0) {
          canvas.width = sourceVideo.videoWidth;
          canvas.height = sourceVideo.videoHeight;
        }
      }
      try {
        await segmenter.send({ image: sourceVideo });
      } catch (_) {}
    } else if (ctx && sourceVideo.readyState >= 2) {
      ctx.drawImage(sourceVideo, 0, 0, canvas.width, canvas.height);
    }
    animFrameId = requestAnimationFrame(processFrame);
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
