/**
 * Chakavak Client-Side Media Compressor & Resizer
 * High-performance, client-side photo and video optimization before transmission.
 * Reduces bandwidth usage, prevents upload timeouts, and accelerates delivery.
 */

/**
 * Calculates optimal downscaled dimensions while strictly maintaining aspect ratio.
 *
 * @param {number} width - Original image/video width
 * @param {number} height - Original image/video height
 * @param {number} [maxDimension=1920] - Maximum allowable bounding dimension
 * @returns {{ width: number, height: number, scaled: boolean }}
 */
export function calculateDownscaleDimensions(width, height, maxDimension = 1920) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const maxDim = Number(maxDimension) || 1920;

  if (w <= 0 || h <= 0) {
    return { width: 0, height: 0, scaled: false };
  }

  if (w <= maxDim && h <= maxDim) {
    return { width: w, height: h, scaled: false };
  }

  const ratio = Math.min(maxDim / w, maxDim / h);
  const nextW = Math.max(1, Math.round(w * ratio));
  const nextH = Math.max(1, Math.round(h * ratio));

  return { width: nextW, height: nextH, scaled: true };
}

/**
 * Formats byte size into human-readable MB / KB string.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  const b = Number(bytes) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Computes savings percentage between original and compressed size.
 *
 * @param {number} originalBytes
 * @param {number} compressedBytes
 * @returns {number}
 */
export function calculateSavingsPercent(originalBytes, compressedBytes) {
  const orig = Number(originalBytes) || 0;
  const comp = Number(compressedBytes) || 0;
  if (orig <= 0 || comp >= orig) return 0;
  return Math.min(99, Math.max(1, Math.round(((orig - comp) / orig) * 100)));
}

/**
 * Quality presets configuration for image compression.
 */
export const IMAGE_QUALITY_PRESETS = {
  balanced: {
    id: "balanced",
    label: "کیفیت بالا (Full HD)",
    subtitle: "WebP 1080p • بهینه برای گفتگو",
    maxDimension: 1920,
    quality: 0.82,
  },
  eco: {
    id: "eco",
    label: "اقتصادی (HD)",
    subtitle: "WebP 720p • حداکثر صرفه‌جویی",
    maxDimension: 1280,
    quality: 0.75,
  },
  original: {
    id: "original",
    label: "کیفیت اصلی (Original)",
    subtitle: "بدون تغییر • حجم و ابعاد کامل",
    maxDimension: null,
    quality: 1.0,
  },
};

/**
 * Quality presets configuration for video compression.
 */
export function selectOptimalVideoMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "video/webm";
  }
  const formats = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  for (const fmt of formats) {
    try {
      if (MediaRecorder.isTypeSupported(fmt)) {
        return fmt;
      }
    } catch (_) {}
  }
  return "video/webm";
}

export const VIDEO_QUALITY_PRESETS = {
  "720p": {
    id: "720p",
    label: "720p (HD روان و باکیفیت)",
    maxDimension: 1280,
    bitrate: 3200000, // 3.2 Mbps for smooth playback & lower CPU encoding stress
  },
  "480p": {
    id: "480p",
    label: "480p (اقتصادی)",
    maxDimension: 854,
    bitrate: 1800000, // 1.8 Mbps
  },
  original: {
    id: "original",
    label: "کیفیت اصلی",
    maxDimension: null,
    bitrate: null,
  },
};

/**
 * Compresses and resizes an image file in the browser using Canvas / WebP.
 *
 * @param {File | Blob} file - Input image file
 * @param {Object} [options]
 * @param {"balanced" | "eco" | "original"} [options.preset="balanced"]
 * @param {number} [options.maxDimension] - Custom max dimension override
 * @param {number} [options.quality] - Custom quality (0.0 to 1.0)
 * @returns {Promise<{
 *   file: File | Blob,
 *   width: number,
 *   height: number,
 *   originalSizeBytes: number,
 *   compressedSizeBytes: number,
 *   savingsPercent: number,
 *   isCompressed: boolean,
 *   previewUrl: string | null
 * }>}
 */
export async function compressImageFile(file, options = {}) {
  const originalSize = Number(file?.size || 0);
  const mimeType = String(file?.type || "image/jpeg").toLowerCase();

  // If no file or original is requested, or animated GIF / SVG: keep untouched!
  const presetKey = options.preset || "balanced";
  const preset = IMAGE_QUALITY_PRESETS[presetKey] || IMAGE_QUALITY_PRESETS.balanced;

  const isBypassType = mimeType === "image/gif" || mimeType === "image/svg+xml";

  if (!file || presetKey === "original" || isBypassType) {
    let previewUrl = null;
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" && file instanceof Blob) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (_) {}
    }
    return {
      file,
      width: null,
      height: null,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercent: 0,
      isCompressed: false,
      previewUrl,
    };
  }

  const maxDim = options.maxDimension || preset.maxDimension || 1920;
  const quality = typeof options.quality === "number" ? options.quality : preset.quality;

  try {
    let sourceWidth = 0;
    let sourceHeight = 0;
    let imageSource = null;

    if (typeof createImageBitmap === "function") {
      imageSource = await createImageBitmap(file);
      sourceWidth = imageSource.width;
      sourceHeight = imageSource.height;
    } else if (typeof Image !== "undefined") {
      imageSource = await new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(e);
        };
        img.src = url;
      });
      sourceWidth = imageSource.naturalWidth || imageSource.width;
      sourceHeight = imageSource.naturalHeight || imageSource.height;
    }

    if (!imageSource || sourceWidth <= 0 || sourceHeight <= 0) {
      return {
        file,
        width: sourceWidth || null,
        height: sourceHeight || null,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercent: 0,
        isCompressed: false,
        previewUrl: null,
      };
    }

    const { width: targetW, height: targetH } = calculateDownscaleDimensions(
      sourceWidth,
      sourceHeight,
      maxDim,
    );

    let canvas = null;
    let ctx = null;

    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(targetW, targetH);
      ctx = canvas.getContext("2d");
    } else if (typeof document !== "undefined" && typeof document.createElement === "function") {
      canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      ctx = canvas.getContext("2d");
    }

    if (!canvas || !ctx) {
      return {
        file,
        width: sourceWidth,
        height: sourceHeight,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercent: 0,
        isCompressed: false,
        previewUrl: null,
      };
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(imageSource, 0, 0, targetW, targetH);

    // Prefer WebP with fallback to JPEG
    let targetFormat = "image/webp";
    let compressedBlob = null;

    if (canvas.convertToBlob) {
      try {
        compressedBlob = await canvas.convertToBlob({ type: targetFormat, quality });
      } catch (_) {
        targetFormat = "image/jpeg";
        compressedBlob = await canvas.convertToBlob({ type: targetFormat, quality });
      }
    } else if (canvas.toBlob) {
      compressedBlob = await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              // Fallback to jpeg
              targetFormat = "image/jpeg";
              canvas.toBlob((b2) => resolve(b2), "image/jpeg", quality);
            }
          },
          targetFormat,
          quality,
        );
      });
    }

    if (imageSource && typeof imageSource.close === "function") {
      imageSource.close();
    }

    if (!compressedBlob || compressedBlob.size <= 0) {
      return {
        file,
        width: sourceWidth,
        height: sourceHeight,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercent: 0,
        isCompressed: false,
        previewUrl: null,
      };
    }

    // If the compressed output is not smaller than original, keep original!
    if (compressedBlob.size >= originalSize && originalSize > 0) {
      return {
        file,
        width: sourceWidth,
        height: sourceHeight,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercent: 0,
        isCompressed: false,
        previewUrl: URL.createObjectURL(file),
      };
    }

    // Generate output file with appropriate extension
    const ext = targetFormat === "image/webp" ? ".webp" : ".jpg";
    let baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "image";
    const newFileName = `${baseName}${ext}`;

    const compressedFile =
      typeof File === "function"
        ? new File([compressedBlob], newFileName, {
            type: targetFormat,
            lastModified: Date.now(),
          })
        : compressedBlob;

    const savings = calculateSavingsPercent(originalSize, compressedBlob.size);
    const previewUrl = URL.createObjectURL(compressedBlob);

    return {
      file: compressedFile,
      width: targetW,
      height: targetH,
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedBlob.size,
      savingsPercent: savings,
      isCompressed: true,
      previewUrl,
    };
  } catch (err) {
    console.warn("compressImageFile failed, falling back to original:", err);
    return {
      file,
      width: null,
      height: null,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercent: 0,
      isCompressed: false,
      previewUrl: null,
    };
  }
}

/**
 * Transcodes or mutes a video file in the browser using Canvas & MediaRecorder.
 *
 * @param {File | Blob} file - Input video file
 * @param {Object} [options]
 * @param {"720p" | "480p" | "original"} [options.targetQuality="720p"]
 * @param {boolean} [options.muteAudio=false]
 * @param {Function} [options.onProgress] - Callback with 0 to 1 progress
 * @returns {Promise<{
 *   file: File | Blob,
 *   width?: number,
 *   height?: number,
 *   duration?: number,
 *   originalSizeBytes: number,
 *   compressedSizeBytes: number,
 *   savingsPercent: number,
 *   isCompressed: boolean,
 *   isMuted: boolean,
 *   previewUrl: string | null
 * }>}
 */
export async function compressVideoFile(file, options = {}) {
  const originalSize = Number(file?.size || 0);
  const targetQuality = options.targetQuality || "720p";
  const muteAudio = Boolean(options.muteAudio);

  // If original quality requested and not muted: bypass transcoding
  if (targetQuality === "original" && !muteAudio) {
    let previewUrl = null;
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function" && file instanceof Blob) {
      try { previewUrl = URL.createObjectURL(file); } catch (_) {}
    }
    return {
      file,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercent: 0,
      isCompressed: false,
      isMuted: false,
      previewUrl,
    };
  }

  // Check MediaRecorder & video element support
  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    typeof MediaRecorder === "undefined"
  ) {
    return {
      file,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercent: 0,
      isCompressed: false,
      isMuted: false,
      previewUrl: null,
    };
  }

  let video = null;
  let audioCtx = null;

  try {
    video = document.createElement("video");
    video.autoplay = false;
    video.playsInline = true;
    video.preload = "auto";
    video.src = URL.createObjectURL(file);

    // CRITICAL: Mount inside active viewport or user container.
    // Placing offscreen (-9999px) or opacity: 0 triggers Chromium compositor throttling
    // which drops requestVideoFrameCallback decoding to 1-5 fps.
    if (options.containerElement && typeof options.containerElement.appendChild === "function") {
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "contain";
      video.style.display = "block";
      options.containerElement.appendChild(video);
    } else {
      video.style.position = "fixed";
      video.style.top = "0px";
      video.style.left = "0px";
      video.style.width = "160px";
      video.style.height = "120px";
      video.style.opacity = "0.02";
      video.style.pointerEvents = "none";
      video.style.zIndex = "99999";
      document.body.appendChild(video);
    }

    await new Promise((resolve, reject) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          reject(new Error("Video metadata load timeout"));
        }
      }, 10000);

      video.onloadedmetadata = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve();
        }
      };
      video.onerror = (e) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(e || new Error("Video loading error"));
        }
      };
    });

    const vW = video.videoWidth || 640;
    const vH = video.videoHeight || 480;
    const duration = video.duration || 0;

    const preset = VIDEO_QUALITY_PRESETS[targetQuality] || VIDEO_QUALITY_PRESETS["720p"];
    const maxDim = preset.maxDimension || Math.max(vW, vH);
    const { width: targetW, height: targetH } = calculateDownscaleDimensions(vW, vH, maxDim);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    // CRITICAL: Hardware-accelerated Canvas 2D (DO NOT use willReadFrequently which forces software CPU fallback)
    const ctx =
      canvas.getContext("2d", { alpha: false, desynchronized: true }) ||
      canvas.getContext("2d");

    // Pre-paint initial video frame onto canvas before recording starts
    if (ctx) {
      ctx.drawImage(video, 0, 0, targetW, targetH);
    }

    // Capture 30 fps stream from hardware canvas
    const stream = canvas.captureStream(30);
    const videoTrack = stream.getVideoTracks()[0] || null;

    // Audio handling: if not muted, route audio into stream silently via Web Audio API
    if (!muteAudio) {
      const AudioCtx =
        typeof window !== "undefined" &&
        (window.AudioContext || window.webkitAudioContext);
      if (AudioCtx) {
        try {
          audioCtx = new AudioCtx();
          if (audioCtx.state === "suspended") {
            await audioCtx.resume().catch(() => {});
          }
          const sourceNode = audioCtx.createMediaElementSource(video);
          const destNode = audioCtx.createMediaStreamDestination();
          sourceNode.connect(destNode);
          const audioTrack = destNode.stream.getAudioTracks()[0] || null;
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        } catch (e) {
          console.warn("Web Audio capture failed, falling back to captureStream:", e);
        }
      }
      if (!stream.getAudioTracks().length && typeof video.captureStream === "function") {
        try {
          const cap = video.captureStream();
          const trk = cap.getAudioTracks()[0] || null;
          if (trk) stream.addTrack(trk);
        } catch (_) {}
      }
    }

    const mimeType = selectOptimalVideoMimeType();

    const recordedChunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: preset.bitrate || 2500000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    const completionPromise = new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType });
        resolve(blob);
      };
    });

    // Start video playback FIRST to ensure presentation clock and hardware decoder are active
    video.currentTime = 0;
    video.muted = muteAudio;
    video.volume = muteAudio ? 0 : 1;

    try {
      await video.play();
    } catch (playErr) {
      console.warn("Unmuted video play rejected by browser autoplay policy, attempting muted play:", playErr);
      video.muted = true;
      await video.play().catch(() => {});
    }

    // Start recording at 1000ms timeslices (avoids interrupting event loop 10 times a second)
    recorder.start(1000);

    // Draw video frames synchronized to hardware presentation
    await new Promise((resolve) => {
      let active = true;

      const finish = () => {
        if (!active) return;
        active = false;
        resolve();
      };

      video.onended = finish;
      video.onerror = finish;
      video.onpause = () => {
        if (video.currentTime >= duration - 0.25) {
          finish();
        }
      };

      // Safety timeout in case browser never fires onended
      const maxSafetyMs = Math.max(10000, Math.ceil((duration + 4) * 1000));
      const safetyTimer = setTimeout(() => {
        if (active) {
          console.warn("Video compression safety timeout reached, concluding stream");
          finish();
        }
      }, maxSafetyMs);

      const hasVideoFrameCallback = typeof video.requestVideoFrameCallback === "function";

      if (hasVideoFrameCallback) {
        function onFrame() {
          if (!active) return;
          if (video.ended || (video.paused && video.currentTime >= duration - 0.25)) {
            clearTimeout(safetyTimer);
            finish();
            return;
          }
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH);
          }
          if (videoTrack && typeof videoTrack.requestFrame === "function") {
            try { videoTrack.requestFrame(); } catch (_) {}
          }
          if (options.onProgress && duration > 0) {
            options.onProgress(Math.min(1.0, video.currentTime / duration));
          }
          video.requestVideoFrameCallback(onFrame);
        }
        video.requestVideoFrameCallback(onFrame);
      } else {
        function onRaf() {
          if (!active) return;
          if (video.ended || (video.paused && video.currentTime >= duration - 0.25)) {
            clearTimeout(safetyTimer);
            finish();
            return;
          }
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetW, targetH);
          }
          if (videoTrack && typeof videoTrack.requestFrame === "function") {
            try { videoTrack.requestFrame(); } catch (_) {}
          }
          if (options.onProgress && duration > 0) {
            options.onProgress(Math.min(1.0, video.currentTime / duration));
          }
          requestAnimationFrame(onRaf);
        }
        requestAnimationFrame(onRaf);
      }
    });

    if (recorder.state === "recording") {
      recorder.stop();
    }

    const transcodedBlob = await completionPromise;

    if (!transcodedBlob || transcodedBlob.size <= 0) {
      return {
        file,
        width: vW,
        height: vH,
        duration,
        originalSizeBytes: originalSize,
        compressedSizeBytes: originalSize,
        savingsPercent: 0,
        isCompressed: false,
        isMuted: false,
        previewUrl: null,
      };
    }

    const ext = mimeType.includes("mp4") ? ".mp4" : ".webm";
    const baseName = file.name ? file.name.replace(/\.[^/.]+$/, "") : "video";
    const newName = `${baseName}_optimized${ext}`;

    const compressedFile =
      typeof File === "function"
        ? new File([transcodedBlob], newName, {
            type: mimeType,
            lastModified: Date.now(),
          })
        : transcodedBlob;

    const savings = calculateSavingsPercent(originalSize, transcodedBlob.size);
    const previewUrl = URL.createObjectURL(transcodedBlob);

    return {
      file: compressedFile,
      width: targetW,
      height: targetH,
      duration,
      originalSizeBytes: originalSize,
      compressedSizeBytes: transcodedBlob.size,
      savingsPercent: savings,
      isCompressed: true,
      isMuted: muteAudio,
      previewUrl,
    };
  } catch (err) {
    console.warn("compressVideoFile failed, falling back to original:", err);
    return {
      file,
      originalSizeBytes: originalSize,
      compressedSizeBytes: originalSize,
      savingsPercent: 0,
      isCompressed: false,
      isMuted: false,
      previewUrl: null,
    };
  } finally {
    if (audioCtx && typeof audioCtx.close === "function") {
      audioCtx.close().catch(() => {});
    }
    if (video) {
      try { video.pause(); } catch (_) {}
      if (video.src) {
        try { URL.revokeObjectURL(video.src); } catch (_) {}
      }
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    }
  }
}
