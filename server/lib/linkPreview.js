import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

// In-memory cache with 1 hour TTL
const PREVIEW_CACHE = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 500;
const MAX_BODY_BYTES = 512 * 1024; // 512 KB to avoid DOS

function isPrivateIp(hostname) {
  const clean = hostname.toLowerCase();
  if (
    clean === "localhost" ||
    clean === "127.0.0.1" ||
    clean === "::1" ||
    clean === "0.0.0.0" ||
    clean.endsWith(".local") ||
    clean.endsWith(".internal")
  ) {
    return true;
  }
  // IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 169.254.x.x
  if (
    /^10\./.test(clean) ||
    /^192\.168\./.test(clean) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean) ||
    /^169\.254\./.test(clean)
  ) {
    return true;
  }
  return false;
}

export function extractFirstUrl(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s<>"'{}|\\^`[\]]+/i);
  return match ? match[0] : null;
}

export function parseHtmlMetadata(html, targetUrl) {
  if (!html || typeof html !== "string") return null;

  let title = "";
  let description = "";
  let image = "";
  let siteName = "";

  // 1. og:title / twitter:title / <title>
  const ogTitleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
  if (ogTitleMatch) {
    title = ogTitleMatch[1];
  } else {
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleTagMatch) {
      title = titleTagMatch[1];
    }
  }

  // 2. og:description / twitter:description / description
  const ogDescMatch =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (ogDescMatch) {
    description = ogDescMatch[1];
  }

  // 3. og:image / twitter:image
  const ogImageMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    image = ogImageMatch[1];
  }

  // 4. og:site_name
  const siteNameMatch =
    html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  if (siteNameMatch) {
    siteName = siteNameMatch[1];
  }

  // Resolve relative image URLs
  if (image && !/^https?:\/\//i.test(image) && targetUrl) {
    try {
      image = new URL(image, targetUrl).toString();
    } catch {}
  }

  // Clean strings
  const clean = (str) =>
    str
      ? str
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim()
      : "";

  title = clean(title).slice(0, 300);
  description = clean(description).slice(0, 500);
  siteName = clean(siteName).slice(0, 100);

  if (!title && !description && !image) {
    return null;
  }

  return {
    url: targetUrl,
    title: title || null,
    description: description || null,
    image: image || null,
    siteName: siteName || null,
  };
}

export async function fetchLinkPreview(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  if (isPrivateIp(parsed.hostname)) {
    return null;
  }

  const urlKey = parsed.toString();
  const cached = PREVIEW_CACHE.get(urlKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  return new Promise((resolve) => {
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    const req = client.get(
      urlKey,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ChakavakBot/1.0",
          Accept: "text/html,application/xhtml+xml;q=0.9",
        },
        timeout: 4000,
      },
      (res) => {
        // Only accept successful HTML responses
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          try {
            const redirectUrl = new URL(res.headers.location, urlKey).toString();
            resolve(fetchLinkPreview(redirectUrl));
            return;
          } catch {
            resolve(null);
            return;
          }
        }

        if (res.statusCode !== 200) {
          resolve(null);
          return;
        }

        const contentType = res.headers["content-type"] || "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
          resolve(null);
          return;
        }

        let body = "";
        let bytes = 0;

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          bytes += Buffer.byteLength(chunk, "utf8");
          if (bytes > MAX_BODY_BYTES) {
            req.destroy();
            return;
          }
          body += chunk;
        });

        res.on("end", () => {
          const meta = parseHtmlMetadata(body, urlKey);
          if (meta) {
            if (PREVIEW_CACHE.size >= MAX_CACHE_SIZE) {
              const oldestKey = PREVIEW_CACHE.keys().next().value;
              if (oldestKey) PREVIEW_CACHE.delete(oldestKey);
            }
            PREVIEW_CACHE.set(urlKey, {
              timestamp: Date.now(),
              data: meta,
            });
          }
          resolve(meta);
        });

        res.on("error", () => resolve(null));
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });

    req.on("error", () => resolve(null));
  });
}
