import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { Buffer } from "buffer";
import axios from "axios";
import https from "https";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Bypass SSL verification to handle ISP (Indosat) blocking/hijacking
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const sslAgent = new https.Agent({
  rejectUnauthorized: false,
});

app.use(cors());

// --- CONSTANTS ---
const HANIME_API = "https://hanime.tv/api/v8";
const HANIME_SEARCH_API = "https://search.htv-services.com";
const CAVPORN_BASE = "https://cav103.com";
const ORENO3D_BASE = "https://oreno3d.com";
const IWARA_API_BASE = "https://api.iwara.tv";
const IWARA_WEB_BASE = "https://www.iwara.tv";

// Helper for Hanime rapi/v7 headers
const getHanimeV7Headers = () => {
  const time = Math.floor(Date.now() / 1000);
  const signature = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return {
    "X-Signature": signature,
    "X-Time": time.toString(),
    "X-Signature-Version": "web2",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Origin": "https://hanime.tv",
    "Referer": "https://hanime.tv/"
  };
};

// Proxy endpoint for creators
app.get("/api/creators", async (req, res) => {
  try {
    console.log("Fetching creators from Pawchive API...");

    const response = await fetch("https://pawchive.st/api/v1/creators", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://pawchive.st/",
      },
    });

    if (!response.ok) {
      throw new Error(
        `API responded with ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} creators.`);

    res.json(data);
  } catch (error) {
    console.error("Proxy Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for specific creator's posts
app.get("/api/posts/:service/:id", async (req, res) => {
  const { service, id } = req.params;
  try {
    console.log(`Fetching posts for ${service}/${id}...`);

    const response = await fetch(
      `https://pawchive.st/api/v1/${service}/user/${id}/posts`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: "https://pawchive.st/",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `API responded with ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.length} posts.`);
    res.json(data);
  } catch (error) {
    console.error("Proxy Error (Posts):", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PAWCHIVE MEDIA PROXY
// Directly proxy images/videos from img.pawchive.st
// with correct Referer header to bypass hotlink protection
// ==========================================
app.get("/api/media/pawchive", async (req, res) => {
  const { path: mediaPath } = req.query;
  if (!mediaPath) return res.status(400).send("Missing path");

  // Only allow paths that look like Pawchive hash paths (e.g. /ab/cd/abcd1234....jpg)
  if (!/^\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]+\.[a-z0-9]+$/i.test(mediaPath)) {
    return res.status(400).send("Invalid path format");
  }

  const targetUrl = `https://img.pawchive.st${mediaPath}`;
  console.log(`[Pawchive Media] Proxying: ${targetUrl}`);

  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://pawchive.st/",
      "Origin": "https://pawchive.st",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    };

    // Forward Range header for video seeking
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(targetUrl, {
      headers,
      agent: sslAgent,
    });

    if (!response.ok) {
      console.warn(`[Pawchive Media] Failed ${response.status}: ${targetUrl}`);
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    // Forward relevant headers
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const contentRange = response.headers.get("content-range");
    const acceptRanges = response.headers.get("accept-ranges");

    if (contentType) res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (response.status === 206) res.status(206);

    response.body.pipe(res);
  } catch (error) {
    console.error("[Pawchive Media] Error:", error.message);
    res.status(500).send(`Proxy error: ${error.message}`);
  }
});


// --- PornavHD SCRAPER Integration ---
const PornavHD_BASE_URL = "https://pornavhd.com"; // Changed from pornavhd.com to .si mirror
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1",
];
const getRandomUA = () => UAS[Math.floor(Math.random() * UAS.length)];

// Helper headers
const getNekoHeaders = (referer = PornavHD_BASE_URL) => ({
  "User-Agent": getRandomUA(),
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  Referer: referer,
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Timeout wrapper for node-fetch
const fetchWithTimeout = (url, options, timeout = 20000) => {
  return Promise.race([
    fetch(url, { ...options, agent: sslAgent }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))
  ]);
};

// Helper: Try to fetch from multiple sources (Shared)
const fetchWithFallback = async (
  targetUrl,
  customHeaders = {},
  skipDirect = false,
) => {
  let lastError;

  const defaultHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ...customHeaders,
  };

  // 1. Direct Fetch
  if (!skipDirect) {
    try {
      console.log(`[Proxy] Direct: ${targetUrl}`);
      const res = await fetchWithTimeout(targetUrl, { headers: defaultHeaders });

      // Check for ISP Block / Soft Block
      const text = await res.text();
      if (
        res.ok &&
        !text.includes("Internet Positif") &&
        !text.includes("mercysub")
      ) {
        return text;
      }

      console.warn(`[Proxy] Direct failed: ${res.status} or Blocked`);
      lastError = `Direct: ${res.status} or Blocked`;
    } catch (e) {
      console.warn(`[Proxy] Direct error: ${e.message}`);
      lastError = e.message;
    }
    await delay(1000); // Wait 1s before proxy to be polite
  } else {
    console.log(`[Proxy] Skipping Direct Fetch for ${targetUrl}`);
  }

  // 2. CorsProxy.io
  try {
    console.log(`[Proxy] CorsProxy: ${targetUrl}`);
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, { headers: defaultHeaders });
    if (res.ok) return await res.text();
    lastError = `CorsProxy: ${res.status}`;
  } catch (e) {
    lastError = e.message;
  }

  await delay(500);

  // 3. CodeTabs (New Fallback)
  try {
    console.log(`[Proxy] CodeTabs: ${targetUrl}`);
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, { headers: defaultHeaders });
    if (res.ok) return await res.text();
    lastError = `CodeTabs: ${res.status}`;
  } catch (e) {
    lastError = e.message;
  }

  await delay(500);

  // 4. AllOrigins (Returns RAW content)
  try {
    console.log(`[Proxy] AllOrigins: ${targetUrl}`);
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, { headers: defaultHeaders });
    if (res.ok) return await res.text();
    lastError = `AllOrigins: ${res.status}`;
  } catch (e) {
    lastError = e.message;
  }

  // 5. Ultimate Fallback: Puppeteer Stealth
  try {
    console.log(`[Proxy] Stealth Fallback triggered for: ${targetUrl}`);
    const { fetchWithStealth } = await import("./scraper.js");
    const text = await fetchWithStealth(targetUrl);
    if (text) return text;
    lastError = `Stealth Fallback returned empty`;
  } catch (e) {
    lastError = `Stealth Fallback Error: ${e.message}`;
  }

  throw new Error(`All proxies failed. Last error: ${lastError}`);
};

// ==========================================
// IMAGE PROXY (Bypass ISP Blocks)
// ==========================================
// ==========================================
app.get("/api/proxy/image", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  // Detection list for block pages
  const isBlockPage = (text) => {
    const lower = text.toLowerCase();
    return lower.includes("internet positif") || 
           lower.includes("akses diblokir") || 
           lower.includes("menkominfo") ||
           lower.includes("kemkominfo");
  };

  const tryFetch = async (targetUrl, useHeaders = true) => {
    try {
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };
      if (useHeaders && referer) headers["Referer"] = referer;
      
      const response = await fetchWithTimeout(targetUrl, { headers }, 8000);
      if (!response.ok) return null;
      
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        // Double check if it's a block page
        const text = await response.text();
        if (isBlockPage(text)) return null;
        // If it's HTML but not a block page, we still can't use it as an image
        return null;
      }
      return response;
    } catch (e) {
      return null;
    }
  };

  try {
    let response;

    // Strategy 1: Google Image Proxy (Very hard to block)
    const googleProxy = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(url)}`;
    console.log(`[Image Proxy] Trying Google: ${url.substring(0, 40)}...`);
    response = await tryFetch(googleProxy, false);

    // Strategy 2: WordPress/Jetpack i0.wp.com (Hard to block)
    if (!response) {
      const wpProxy = `https://i0.wp.com/${url.replace(/^https?:\/\//, "")}`;
      console.log(`[Image Proxy] Trying Jetpack: ${url.substring(0, 40)}...`);
      response = await tryFetch(wpProxy, false);
    }

    // Strategy 3: wsrv.nl (Excellent but sometimes blocked)
    if (!response) {
      const wsrvProxy = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
      console.log(`[Image Proxy] Trying wsrv: ${url.substring(0, 40)}...`);
      response = await tryFetch(wsrvProxy, false);
    }

    // Strategy 4: Direct with SSL Bypass (Current NODE_TLS_REJECT_UNAUTHORIZED="0")
    if (!response) {
      console.log(`[Image Proxy] Trying Direct: ${url.substring(0, 40)}...`);
      response = await tryFetch(url, true);
    }

    // Strategy 5: CorsProxy.io
    if (!response) {
      const corsProxy = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      console.log(`[Image Proxy] Trying CorsProxy: ${url.substring(0, 40)}...`);
      response = await tryFetch(corsProxy, true);
    }

    if (!response) {
      throw new Error("All image proxies failed or returned block pages");
    }

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    response.body.pipe(res);

  } catch (error) {
    console.error("[Image Proxy Error]", error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

// Helper to unpack P.A.C.K.E.R code
const unpack = (p, a, c, k, e, d) => {
  while (c--)
    if (k[c])
      p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
  return p;
};

// ==========================================
// COSSORA IFRAME PROXY
// ==========================================
// ==========================================
// COSSORA IFRAME PROXY
// ==========================================
app.get("/api/proxy/cossora", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://nekopoi.care/",
    };

    // Force Proxy (skipDirect = true) to bypass ISP blocks
    let html = await fetchWithFallback(url, headers, true);

    // We can't easily get Content-Type from fetchWithFallback (it returns text),
    // but we know we're mostly serving HTML players.
    res.setHeader("Content-Type", "text/html");

    // Helper to generate player HTML
    const sendPlayer = (videoUrl) => {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}&referer=${encodeURIComponent("https://vidnest.io/")}`; // Default referer to vidnest/streampoi base

      const playerHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>body{margin:0;background:black;height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;} video{width:100%;height:100%;object-fit:contain;}</style>
                <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
            </head>
            <body>
                <video id="video" controls autoplay playsinline></video>
                <script>
                    var video = document.getElementById('video');
                    var videoSrc = "${proxyUrl}";
                    
                    if (Hls.isSupported()) {
                        var hls = new Hls();
                        hls.loadSource(videoSrc);
                        hls.attachMedia(video);
                        hls.on(Hls.Events.MANIFEST_PARSED, function() {
                            video.play().catch(e => console.log("Autoplay blocked", e));
                        });
                        hls.on(Hls.Events.ERROR, function(event, data) {
                             if (data.fatal) {
                                switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    console.log("fatal network error encountered, try to recover");
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    console.log("fatal media error encountered, try to recover");
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    hls.destroy();
                                    break;
                                }
                            }
                        });
                    }
                    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = videoSrc;
                        video.addEventListener('loadedmetadata', function() {
                            video.play().catch(e => console.log("Autoplay blocked", e));
                        });
                    } else {
                        // Direct MP4 fallback
                         video.src = videoSrc;
                         video.play().catch(e => console.log("Autoplay blocked", e));
                    }
                </script>
            </body>
            </html>
        `;
      return res.send(playerHtml);
    };

    // 1. Try P.A.C.K.E.R (Streampoi)
    if (html && html.includes("eval(function(p,a,c,k,e,d)")) {
      try {
        const parts = html.split("eval(function(p,a,c,k,e,d)");
        if (parts.length > 1) {
          let packedBlock = parts[1];
          // ... (Same packed unpacking logic as before, simplified by using regex on the block)
          // Actually, reusing the robust extraction logic from detail scraper is better
          const packedMatch =
            /eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/.exec(
              html,
            );
          if (packedMatch) {
            const unpacked = unpack(packedMatch[0]);

            // Find file: or src:
            const fileMatch =
              /file\s*:\s*["']([^"']+)["']/.exec(unpacked) ||
              /src\s*:\s*["']([^"']+)["']/.exec(unpacked);

            if (fileMatch && fileMatch[1]) {
              return sendPlayer(fileMatch[1]);
            }
          }
        }
      } catch (e) {
        console.warn("Packer unpack error:", e.message);
      }
    }

    // 2. Normal Regex (Vidnest/Cossora) - Robust patterns
    let fileMatch = /file\s*:\s*["']([^"']+)["']/.exec(html);
    if (!fileMatch) fileMatch = /src\s*:\s*["']([^"']+)["']/.exec(html);
    if (!fileMatch) fileMatch = /["']([^"']+\.mp4[^"']*)["']/.exec(html);
    if (!fileMatch) fileMatch = /["']([^"']+\.m3u8[^"']*)["']/.exec(html);

    if (fileMatch && fileMatch[1]) {
      return sendPlayer(fileMatch[1]);
    }

    // Fallback: Inject no-referrer and hope for the best (or maybe it's a different player source)
    const modifiedHtml = html.replace(
      "<head>",
      '<head><meta name="referrer" content="no-referrer">',
    );
    res.send(modifiedHtml);
  } catch (error) {
    console.error("Cossora Proxy Error:", error.message);
    res.status(500).send("Error fetching video");
  }
});

// Search & Latest Endpoint (Scraper)
app.get("/api/hnime/search", async (req, res) => {
  try {
    let { q, page } = req.query;
    page = parseInt(page) || 1;

    const { scrapePornavHDSearch } = await import("./scraper.js");
    const posts = await scrapePornavHDSearch(q, page);

    res.json({
      hits: JSON.stringify(posts),
      page: page,
      nbPages: 50,
      hitsPerPage: posts.length,
    });
  } catch (err) {
    console.error(`[Puppeteer] Search Error:`, err);
    res
      .status(500)
      .json({ error: "Failed to fetch data", details: err.message });
  }
});

// Video Details Endpoint (Scraper)
app.get(/^\/api\/hnime\/video\/(.*)$/, async (req, res) => {
  const slug = req.params[0];

  try {
    const { scrapePornavHDVideo } = await import("./scraper.js");
    const videoData = await scrapePornavHDVideo(slug);

    if (!videoData) throw new Error("Failed to retrieve content from PornavHD.");

    res.json({
      id: slug,
      slug: slug,
      name: videoData.title,
      iframe_url: videoData.embedUrl,
      description: "Video scraped via Puppeteer from PornavHD.",
      cover_url: videoData.coverUrl,
      sources: [],
      files: []
    });
  } catch (e) {
    console.error("[PornavHD/Hnime] Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// PornavHD Detail Endpoint
app.get("/api/PornavHD/detail", async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Slug is required" });

  try {
    // Try domains until one works
    const domains = [
      "https://pornavhd.com",
      "https://pornavhd.com",
      "https://pornavhd.com",
      "https://pornavhd.com",
    ];
    let html = null;
    let usedDomain = "";

    for (const domain of domains) {
      try {
        const url = `${domain}/a/${slug}`;
        console.log(`[PornavHD] Trying detail: ${url}`);
        html = await fetchWithFallback(url, getNekoHeaders());
        if (
          html &&
          !html.includes("404 Not Found") &&
          (html.includes("grid-images_box") || html.includes("group/item"))
        ) {
          usedDomain = domain;
          break;
        }
      } catch (e) {
        console.warn(`[PornavHD] Failed ${domain}: ${e.message}`);
      }
    }

    if (!html || !usedDomain) {
      throw new Error("Album not found on any PornavHD domain");
    }

    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || $("title").text().trim();
    const files = [];

    // Parse Files (Both new and old layouts)
    // Layout A: div.relative.group/item
    $("div.relative.group\\/item").each((i, el) => {
      const link = $(el).find("a[href*='/f/']").first();
      const href = link.attr("href");
      const thumb = $(el).find("img").attr("src");
      const name = $(el).find("p").first().text().trim() || link.text().trim();

      if (href) {
        const fileSlugMatch = /\/f\/([a-zA-Z0-9]+)/.exec(href);
        if (fileSlugMatch) {
          files.push({
            slug: fileSlugMatch[1],
            name: name,
            thumb: thumb,
            domain: usedDomain, // store domain to construct file URL
          });
        }
      }
    });

    // Layout B: grid-images_box (older?)
    if (files.length === 0) {
      $(".grid-images_box").each((i, el) => {
        const link = $(el).closest("a") || $(el).find("a").first();
        const href = link.attr("href");
        // ... (similar extraction)
        // For brevity, relying on the robust one mostly.
        if (href && href.includes("/f/")) {
          const fileSlugMatch = /\/f\/([a-zA-Z0-9]+)/.exec(href);
          if (fileSlugMatch) {
            const thumb = $(el).find("img").attr("src");
            files.push({
              slug: fileSlugMatch[1],
              name: "File " + (i + 1),
              thumb: thumb,
              domain: usedDomain,
            });
          }
        }
      });
    }

    console.log(`[PornavHD] Found ${files.length} files in album.`);

    // Helper to determine type
    const getType = (name) => {
      const ext = name.split(".").pop().toLowerCase();
      if (["mp4", "mkv", "webm", "avi", "mov", "m4v"].includes(ext))
        return "video";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
      return "file";
    };

    // Extract raw video URL for the FIRST video found (to be efficient)
    // We can do this lazily on frontend, but for "sources" we want valid links.
    // NOTE: Generating "sources" for ALL files is slow if we have to fetch every page.
    // STRATEGY: Return the file page URL as the "src" and let a centralized Play/Proxy endpoint handle the extraction.
    // BUT user wants "Raw Video".
    // Let's extract the FIRST video immediately so the main player works.

    let defaultVideoUrl = "";
    const firstVideo = files.find((f) => getType(f.name) === "video");

    if (firstVideo) {
      try {
        const filePageUrl = `${firstVideo.domain}/f/${firstVideo.slug}`;
        console.log(`[PornavHD] Extracting raw video from: ${filePageUrl}`);
        const fileHtml = await fetchWithFallback(filePageUrl, getNekoHeaders());

        // Robust extraction similar to CavPorn/Nekopoi
        const $f = cheerio.load(fileHtml);
        let rawSrc = "";

        // 1. Look for <video> or <source>
        rawSrc =
          $f("source[src*='.mp4']").attr("src") || $f("video").attr("src");

        // 2. Regex in scripts (mediaUrl | linkUrl)
        if (!rawSrc) {
          const match =
            /mediaUrl\s*=\s*["']([^"']+)["']/.exec(fileHtml) ||
            /linkUrl\s*=\s*["']([^"']+)["']/.exec(fileHtml) ||
            /downloadUrl\s*=\s*["']([^"']+)["']/.exec(fileHtml);
          if (match) rawSrc = match[1];
        }

        // 3. Look for the "Download" button href
        if (!rawSrc) {
          rawSrc = $f("a.btn-main:contains('Download')").attr("href");
        }

        if (rawSrc) defaultVideoUrl = rawSrc;
      } catch (e) {
        console.error("Failed to extract default video:", e.message);
      }
    }

    // Build Sources List
    const sources = files.map((f, i) => {
      const type = getType(f.name);
      return {
        name: f.name,
        type: type,
        // For images, we can guess the direct link or valid thumb
        url:
          type === "image"
            ? f.thumb.replace("/thumbs/", "/")
            : `${f.domain}/f/${f.slug}`,
        slug: f.slug,
        domain: f.domain,
        isDefault: firstVideo && f.slug === firstVideo.slug,
      };
    });

    res.json({
      id: slug,
      slug: slug,
      name: title,
      description: "Scraped from PornavHD via Reddit",
      views: 0,
      poster_url: firstVideo?.thumb || "",
      // If we found a direct link for the default video, pass it.
      // Otherwise frontend uses the /f/ link (which we need to handle in proxy or frontend)
      rawVideoUrls: defaultVideoUrl
        ? [{ url: defaultVideoUrl, referer: usedDomain }]
        : [],
      sources: sources,
    });
  } catch (err) {
    console.error("PornavHD Detail Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generic Proxy for Streams (m3u8/ts) & Images/Videos
app.get("/api/proxy", async (req, res) => {
  const { url, referer } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const decodedUrl = decodeURIComponent(url);
    const decodedReferer = referer ? decodeURIComponent(referer) : null;

    // Default headers
    const headers = {
      "User-Agent":
        req.headers["user-agent"] ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    // Add Referer if provided
    if (decodedReferer) {
      headers["Referer"] = decodedReferer;
      headers["Origin"] = new URL(decodedReferer).origin;
    }

    // Forward Cookies (Critical for authenticated streams)
    if (req.headers.cookie) {
      headers["Cookie"] = req.headers.cookie;
    }

    // Forward Range header if present (Critical for video seeking/buffering)
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    if (req.headers["x-version"]) {
      headers["X-Version"] = req.headers["x-version"];
    }

    let response;
    try {
      console.log(`[Proxy] Attempting Direct: ${decodedUrl}`);
      response = await fetch(decodedUrl, { headers, redirect: "manual" });
    } catch (e) {
      console.warn(`[Proxy] Direct Fetch Error: ${e.message}`);
    }

    // Fallback if direct failed or returned 403/404 (and not a redirect)
    if (
      !response ||
      (!response.ok && response.status !== 302 && response.status !== 301)
    ) {
      console.warn(
        `[Proxy] Direct failed: ${response ? response.status : "Network Error"}. Trying Fallback...`,
      );
      
      // Auto-correction for Hanime domains
      let targetUrl = decodedUrl;
      if (decodedUrl.includes("streamable.cloud")) {
        targetUrl = decodedUrl.replace("streamable.cloud", "weeb.hanime.tv");
        console.log(`[Proxy] Auto-correcting Hanime domain: ${targetUrl}`);
      }

      try {
        // Fallback 1: CorsProxy.io
        console.log(`[Proxy] Trying Fallback 1: CorsProxy`);
        const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        response = await fetch(fallbackUrl);
        
        if (!response.ok) {
           throw new Error(`CorsProxy returned ${response.status}`);
        }
        console.log(`[Proxy] Fallback 1 Success: ${response.status}`);
      } catch (fallbackErr) {
        console.warn(`[Proxy] Fallback 1 Failed: ${fallbackErr.message}`);
        try {
          // Fallback 2: AllOrigins RAW
          console.log(`[Proxy] Trying Fallback 2: AllOrigins RAW`);
          const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
          response = await fetch(allOriginsUrl);
          console.log(`[Proxy] Fallback 2 Status: ${response.status}`);
        } catch (allOriginsErr) {
          console.error(`[Proxy] Fallback 2 Error: ${allOriginsErr.message}`);
          if (!response) return res.status(500).send("Proxy Error: " + allOriginsErr.message);
        }
      }
    }

    if (!response.ok && response.status !== 206)
      console.warn(`Proxy fetch warning: ${response.status} for ${decodedUrl}`);

    // Forward important headers
    const contentType = response.headers.get("content-type");
    const contentRange = response.headers.get("content-range");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");

    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true"); // Allow cookies

    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    // Forward Set-Cookie (Rewrite Domain to localhost)
    const rawSetCookie = response.headers.get("set-cookie");
    if (rawSetCookie) {
      // Removing 'Domain=...' and 'Secure' and 'SameSite=...' to ensure browser accepts it on localhost
      // Simple strategy: Split multiple cookies and clean them
      const cookies = rawSetCookie.split(/,(?=\s*[^;]+=[^;]+)/g);
      const cleanedCookies = cookies.map((c) => {
        return c
          .replace(/Domain=[^;]+;?/gi, "")
          .replace(/Secure;?/gi, "")
          .replace(/SameSite=[^;]+;?/gi, "");
      });
      res.setHeader("Set-Cookie", cleanedCookies);
    }

    // Set status code (200 or 206)
    res.status(response.status);

    // If it's a playlist (m3u8), rewrites needed
    if (
      contentType &&
      (contentType.includes("mpegurl") ||
        contentType.includes("m3u8") ||
        decodedUrl.endsWith(".m3u8"))
    ) {
      const text = await response.text();
      const host = `https://${req.headers.host}`; // Vercel uses HTTPS

      // Rewrite absolute URLs to go through proxy
      const rewritten = text.replace(/(https?:\/\/[^\s"']+)/g, (match) => {
        let replacement = `${host}/api/proxy?url=${encodeURIComponent(match)}`;
        if (decodedReferer)
          replacement += `&referer=${encodeURIComponent(decodedReferer)}`;
        return replacement;
      });

      // Rewrite relative URLs (lines starting with neither # nor http)
      // m3u8 lines: stream_1080p.m3u8 or segment_001.ts
      // We need to resolve them against the original URL base.
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf("/") + 1);

      const rewrittenRelative = rewritten.replace(
        /^[^#\s](?!http)(.+)$/gm,
        (match) => {
          // If it was already rewritten by the absolute regex, skip (but regex above catches http)
          // If line doesn't start with http, it's relative.
          if (match.startsWith("http")) return match;

          const absolute = new URL(match, baseUrl).href;
          let replacement = `${host}/api/proxy?url=${encodeURIComponent(absolute)}`;
          if (decodedReferer)
            replacement += `&referer=${encodeURIComponent(decodedReferer)}`;
          return replacement;
        },
      );

      res.send(rewrittenRelative);
    } else {
      // Pipe the stream directly instead of buffering!
      response.body.pipe(res);

      // Handle errors during streaming
      response.body.on("error", (err) => {
        console.error("Stream Body Error:", err);
        res.end();
      });
    }
  } catch (err) {
    console.error("Proxy Error:", err.message);
    if (!res.headersSent) res.status(500).send(err.message);
  }
});

// --- Rule34 Integration ---
const R34_USER_ID = "5762968";
const R34_API_KEY =
  "3e73144a2a715c380366a52084f878446dcf717cbac9e14e1f5421e64eb7f4e8237a5fef5fd33474d0fcd046623d4e471fbf9da3485f6b1d2ae1c29ce8fb8233";
const R34_BASE =
  "https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1";

// Tags Endpoint
app.get("/api/r34/tags", async (req, res) => {
  try {
    const { limit } = req.query;
    // q=index for tags
    const targetUrl = `https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&limit=${
      limit || 30
    }&json=1&order=count`;
    console.log(`Fetching Rule34 Tags: ${targetUrl}`);

    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`R34 Tags Error: ${response.status}`);
    }

    const text = await response.text();
    if (!text) return res.json([]);

    try {
      const data = JSON.parse(text);
      res.json(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Tags JSON Parse Error:", text);
      res.json([]);
    }
  } catch (err) {
    console.error("Rule34 Tags Error:", err.message);
    res.status(500).json([]);
  }
});

// Posts Endpoint
app.get("/api/r34/posts", async (req, res) => {
  try {
    const { tags, limit, pid } = req.query; // pid = page id

    // Enforce Blacklist (No LGBT/Gay/Futa/Furry content as requested)
    const blacklist = " -gay -yaoi -male_on_male -bara -futanari -furry";
    const statusTags = "";

    // Combine user tags with blacklist
    const searchTags = (tags || "") + blacklist + statusTags;

    // Construct query
    const params = new URLSearchParams({
      limit: limit || 20,
      pid: pid || 0,
      tags: searchTags.trim(),
      user_id: R34_USER_ID,
      api_key: R34_API_KEY,
    });

    const targetUrl = `${R34_BASE}&${params.toString()}`;
    console.log(`Fetching Rule34: ${tags || "All"} (Page ${pid})`);

    const response = await fetch(targetUrl);

    if (!response.ok) {
      throw new Error(`R34 API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.json([]);
    }

    res.json(data);
  } catch (err) {
    console.error("Rule34 Proxy Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



// ==========================================
// COSPLAY TELE API
// ==========================================

// Helper to parse CosplayTele Posts
const parseCosplayPosts = ($) => {
  const posts = [];
  $(".col.post-item").each((i, el) => {
    const $el = $(el);
    const titleEl = $el.find(".box-text .post-title a");
    const imgEl = $el.find(".box-image img");

    const title = titleEl.text().trim();
    const url = titleEl.attr("href");
    const thumbnail = imgEl.attr("src") || imgEl.attr("data-src");
    const proxiedThumbnail = thumbnail
      ? `/api/proxy/image?url=${encodeURIComponent(thumbnail)}`
      : null;

    // Extract ID/Slug from URL (e.g., https://cosplaytele.com/fern-16/ -> fern-16)
    const slug = url ? url.split("/").filter(Boolean).pop() : null;

    if (title && url) {
      posts.push({
        id: slug,
        slug: slug,
        title,
        url,
        thumbnail: proxiedThumbnail,
        service: "cosplaytele",
      });
    }
  });
  return posts;
};

app.get("/api/cosplay/latest", async (req, res) => {
  const page = req.query.page || 1;
  const url = `https://cosplaytele.com/page/${page}/`;

  try {
    const html = await fetchWithFallback(url);
    const $ = cheerio.load(html);
    const posts = parseCosplayPosts($);
    res.json(posts);
  } catch (error) {
    console.error("CosplayTele Latest Error:", error);
    res.status(500).json({ error: "Failed to fetch cosplay data" });
  }
});

app.get("/api/cosplay/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  const url = `https://cosplaytele.com/page/${page}//?s=${encodeURIComponent(q)}`;

  try {
    const html = await fetchWithFallback(url);
    const $ = cheerio.load(html);
    const posts = parseCosplayPosts($);
    res.json(posts);
  } catch (error) {
    console.error("CosplayTele Search Error:", error);
    res.status(500).json({ error: "Failed to search cosplay data" });
  }
});

app.get("/api/cosplay/videos", async (req, res) => {
  const page = req.query.page || 1;
  const url = `https://cosplaytele.com/category/video-cosplay/page/${page}/`;

  try {
    const html = await fetchWithFallback(url);
    const $ = cheerio.load(html);
    const posts = parseCosplayPosts($);
    res.json(posts);
  } catch (error) {
    console.error("CosplayTele Videos Error:", error);
    res.status(500).json({ error: "Failed to fetch cosplay videos" });
  }
});

app.get("/api/cosplay/detail", async (req, res) => {
  const { url } = req.query; // Expecting full URL or build it from slug? Let's take full URL or slug.
  // Ideally frontend sends slug, we build URL.
  // But let's support "slug" param to be consistent.

  // If param is 'slug', build url.
  let targetUrl = url;
  if (!url && req.query.slug) {
    targetUrl = `https://cosplaytele.com/${req.query.slug}/`;
  }

  if (!targetUrl) return res.status(400).json({ error: "Missing url or slug" });

  try {
    const html = await fetchWithFallback(targetUrl);
    const $ = cheerio.load(html);

    const title = $("h1.entry-title").text().trim();
    const images = [];

    // Extract Images
    $(".entry-content img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        // Use internal proxy
        images.push(`/api/proxy/image?url=${encodeURIComponent(src)}`);
      }
    });

    // Extract Video Iframes (Multiple)
    // Strategy 1: Look for iframes (streams)
    const rawVideoUrls = [];
    const videoPromises = [];
    const videoIframes = [];

    $("iframe").each((i, el) => {
      const src = $(el).attr("src");
      if (src) {
        videoIframes.push(`/api/proxy/cossora?url=${encodeURIComponent(src)}`);

        // Also try to extract raw video URL for HLS player
        const p = (async () => {
          try {
            // console.log(`[Nekopoi] Fetching iframe: ${src}`);
            const iframeHtml = await fetchWithFallback(src, {
              Referer: "https://nekopoi.care/",
            });

            // 1. Try Packer unpacking
            if (iframeHtml.includes("eval(function(p,a,c,k,e,d)")) {
              const packedMatch =
                /eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/.exec(
                  iframeHtml,
                );
              if (packedMatch) {
                const unpacked = unpack(packedMatch[0]);
                // console.log(`[Nekopoi] Unpacked: ${unpacked.substring(0, 50)}...`);

                // Find file: or src:
                const fileMatch =
                  /file\s*:\s*["']([^"']+)["']/.exec(unpacked) ||
                  /src\s*:\s*["']([^"']+)["']/.exec(unpacked);
                if (fileMatch && fileMatch[1]) {
                  const vUrl = fileMatch[1];
                  if (vUrl.includes(".m3u8") || vUrl.includes(".mp4")) {
                    rawVideoUrls.push({
                      url: vUrl,
                      referer: new URL(src).origin + "/",
                    });
                  }
                }
              }
            }

            // 2. Try Direct Regex
            const m3u8Match = /["']([^"']+\.m3u8[^"']*)["']/.exec(iframeHtml);
            if (m3u8Match) {
              rawVideoUrls.push({
                url: m3u8Match[1],
                referer: new URL(src).origin + "/",
              });
            }
          } catch (e) {
            console.warn(
              `[Nekopoi] Failed to extract raw video from ${src}: ${e.message}`,
            );
          }
        })();
        videoPromises.push(p);
      }
    });

    // Wait for all iframe extractions (capped time to avoid slow response)
    if (videoPromises.length > 0) {
      await Promise.allSettled(videoPromises);
    }

    // Extract Download Links
    const downloadLinks = [];
    $("a").each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href");
      const lowerText = text.toLowerCase();

      if (
        href &&
        (lowerText.includes("download") ||
          lowerText.includes("mediafire") ||
          lowerText.includes("gofile") ||
          lowerText.includes("mega.nz") ||
          lowerText.includes("sorafolder"))
      ) {
        downloadLinks.push({ label: text, url: href });
      }
    });

    res.json({
      title,
      images,
      videoIframes, // Return array
      downloadLinks,
      originalUrl: url,
    });
  } catch (error) {
    console.error("Nekopoi Detail Error:", error.message);
    res.status(500).json({ error: "Failed to fetch detail" });
  }
});

// ==========================================
// ORENO3D / IWARA API
// ==========================================
// Source: Iwara Public API (no auth required)
// Docs: https://api.iwara.tv

const IWARA_API = "https://api.iwara.tv";
const IWARA_FILES = "https://files.iwara.tv";

// Map our sort keys to Iwara API sort params
const IWARA_SORT = {
  latest:     "date",
  new:        "date",
  popular:    "trending",
  rated:      "rating",
  popularity: "popularity",
};

// Build thumbnail URL from Iwara file id
const iwaraThumbnail = (video) => {
  if (!video?.file?.id) return null;
  const idx = String(video.thumbnail ?? 0).padStart(2, "0");
  return `${IWARA_FILES}/image/thumbnail/${video.file.id}/${idx}.jpg`;
};

// Normalize a video item from Iwara API to our common shape
const normalizeIwaraVideo = (v) => {
  const thumbRaw = iwaraThumbnail(v);
  return {
    id:        v.id,
    slug:      v.id,
    iwaraId:   v.id,
    iwaraSlug: v.slug || "",
    title:     v.title || "Untitled",
    // Pass referer so proxy/image sends Referer: https://www.iwara.tv/ to files.iwara.tv
    thumbnail: thumbRaw
      ? `/api/proxy/image?url=${encodeURIComponent(thumbRaw)}&referer=${encodeURIComponent("https://www.iwara.tv/")}`
      : null,
    views:     v.numViews  ?? 0,
    likes:     v.numLikes  ?? 0,
    author:    v.user?.name || v.user?.username || "",
    date:      v.createdAt ? v.createdAt.split("T")[0] : "",
    tags:      (v.tags || []).map((t) => t.id || t),
    rating:    v.rating || "",
    externalVideoUrl: `https://www.iwara.tv/video/${v.id}/${v.slug || ""}`,
    originalUrl:      `https://www.iwara.tv/video/${v.id}`,
    // Pass iwaraVideoId explicitly for detail page
    iwaraVideoId: v.id,
  };
};


// ── Iwara API helper: full browser headers + proxy fallback ──────
const IWARA_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Origin": "https://www.iwara.tv",
  "Referer": "https://www.iwara.tv/",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "Connection": "keep-alive",
};

const iwaraFetch = async (url, customHeaders = {}) => {
  const headers = { ...IWARA_HEADERS, ...customHeaders };
  // Try 1: direct with full browser headers
  try {
    const r = await axios.get(url, { headers, timeout: 8000 });
    return r.data;
  } catch (e) {
    if (e.response?.status !== 403) throw e;
    console.warn("[Iwara] 403 direct, trying allorigins proxy...");
  }

  // Try 2: route through allorigins (bypasses IP block)
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const r = await axios.get(proxied, {
      headers: { "User-Agent": headers["User-Agent"], ...customHeaders },
      timeout: 9000,
    });
    if (typeof r.data === "string") return JSON.parse(r.data);
    return r.data;
  } catch (e) {
    console.warn("[Iwara] allorigins failed:", e.message);
  }

  // Try 3: corsproxy.io
  try {
    const proxied = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const r = await axios.get(proxied, {
      headers: customHeaders,
      timeout: 9000
    });
    if (typeof r.data === "string") return JSON.parse(r.data);
    return r.data;
  } catch (e) {
    console.warn("[Iwara] corsproxy.io failed:", e.message);
  }

  throw new Error("Iwara API unreachable (403 from all sources)");
};

// ── Debug endpoint ────────────────────────────────────────────────
app.get("/api/oreno3d/debug", async (req, res) => {
  const results = {};
  const testUrls = {
    direct_bare:    "https://api.iwara.tv/videos?page=0&limit=4&sort=date",
    direct_ecchi:   "https://api.iwara.tv/videos?page=0&limit=4&sort=date&rating=ecchi",
    proxy_bare:     `https://api.allorigins.win/raw?url=${encodeURIComponent("https://api.iwara.tv/videos?page=0&limit=4&sort=date")}`,
    proxy_ecchi:    `https://api.allorigins.win/raw?url=${encodeURIComponent("https://api.iwara.tv/videos?page=0&limit=4&sort=date&rating=ecchi")}`,
  };
  for (const [key, url] of Object.entries(testUrls)) {
    try {
      const r = await axios.get(url, { headers: IWARA_HEADERS, timeout: 8000 });
      const data = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      results[key] = { status: r.status, count: data?.results?.length ?? data?.count ?? "ok", sample_id: data?.results?.[0]?.id || "N/A" };
    } catch(e) {
      results[key] = { error: e.message.slice(0, 80), status: e.response?.status };
    }
  }
  res.json(results);
});

// ── Gallery (latest/sort) ─────────────────────────────────────────
app.get("/api/oreno3d/latest", async (req, res) => {
  const page = Math.max(0, Number(req.query.page || 1) - 1);
  const sort = IWARA_SORT[req.query.sort] || "date";

  try {
    // Try ecchi first, fall back to no-rating filter
    let data = null;
    for (const rating of ["ecchi", ""]) {
      const qs = rating ? `&rating=${rating}` : "";
      try {
        data = await iwaraFetch(`${IWARA_API}/videos?page=${page}&limit=32&sort=${sort}${qs}`);
        if (data?.results?.length > 0) break;
      } catch(e) { /* try next */ }
    }
    if (!data?.results) throw new Error("No results from Iwara");
    const videos = data.results.map(normalizeIwaraVideo);
    console.log(`[Iwara] Got ${videos.length} videos`);
    res.json(videos);
  } catch (err) {
    console.error("[Iwara] Latest error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ── Search ────────────────────────────────────────────────────────
app.get("/api/oreno3d/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });
  const iwaraPage = Math.max(0, Number(page) - 1);
  try {
    const data = await iwaraFetch(`${IWARA_API}/videos?page=${iwaraPage}&limit=32&sort=date&search=${encodeURIComponent(q)}`);
    const videos = (data?.results || []).map(normalizeIwaraVideo);
    console.log(`[Iwara] Search "${q}": ${videos.length} results`);
    res.json(videos);
  } catch (err) {
    console.error("[Iwara] Search error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Detail (metadata from Iwara API) ─────────────────────────────
app.get("/api/oreno3d/detail", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID required" });
  try {
    const v = await iwaraFetch(`${IWARA_API}/video/${id}`);
    if (!v || !v.id) return res.status(404).json({ error: "Video not found" });
    const normalized = normalizeIwaraVideo(v);
    res.json({ ...normalized, iwaraVideoId: v.id });
  } catch (err) {
    console.error("[Iwara] Detail error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Stream (signed video URLs from Iwara) ─────────────────────────
app.get("/api/oreno3d/stream", async (req, res) => {
  const { iwaraId } = req.query;
  if (!iwaraId) return res.status(400).json({ error: "iwaraId required" });
  try {
    console.log(`[Iwara Stream] Fetching for: ${iwaraId}`);
    // Step 1: Get video info (fileUrl)
    const info = await iwaraFetch(`${IWARA_API}/video/${iwaraId}`);
    const fileUrl = info?.fileUrl;
    if (!fileUrl) return res.json({ rawVideoUrls: [] });

    // Step 2: Compute X-Version header (sha1 signature) and fetch sources
    const fileKey = fileUrl.split("/")[6] || "";
    const xVersion = createHash("sha1")
      .update(`${fileKey}_5nFp9kmbNnHdAFhaqMvt`)
      .digest("hex");

    let sourcesData = null;
    const streamHeaders = { "X-Version": xVersion, "User-Agent": "Mozilla/5.0" };
    let debugInfo = [];
    
    // Try direct first (files CDN usually doesn't block Vercel)
    try {
      debugInfo.push(`Trying direct: https:${fileUrl}`);
      const res = await axios.get(`https:${fileUrl}`, { headers: streamHeaders, timeout: 7000 });
      sourcesData = res.data;
      debugInfo.push(`Direct success: ${Array.isArray(sourcesData) ? sourcesData.length : "object"}`);
    } catch (e) {
      debugInfo.push(`Direct failed: ${e.message} (Status: ${e.response?.status})`);
      // Fallback to corsproxy
      try {
        const proxied = `https://corsproxy.io/?${encodeURIComponent("https:" + fileUrl)}`;
        debugInfo.push(`Trying corsproxy: ${proxied}`);
        const res = await axios.get(proxied, { headers: streamHeaders, timeout: 8000 });
        sourcesData = res.data;
        debugInfo.push(`corsproxy success: ${Array.isArray(sourcesData) ? sourcesData.length : "object"}`);
      } catch (err2) {
        debugInfo.push(`corsproxy failed: ${err2.message} (Status: ${err2.response?.status})`);
        
        // Try allorigins just in case it doesn't need X-Version (unlikely)
        try {
          const proxied2 = `https://api.allorigins.win/raw?url=${encodeURIComponent("https:" + fileUrl)}`;
          debugInfo.push(`Trying allorigins: ${proxied2}`);
          const res = await axios.get(proxied2, { headers: streamHeaders, timeout: 8000 });
          sourcesData = res.data;
          debugInfo.push(`allorigins success: ${Array.isArray(sourcesData) ? sourcesData.length : "object"}`);
        } catch (err3) {
          debugInfo.push(`allorigins failed: ${err3.message} (Status: ${err3.response?.status})`);
          throw new Error("All stream fetch attempts failed. Debug: " + debugInfo.join(" | "));
        }
      }
    }

    const rawVideoUrls = [];
    if (Array.isArray(sourcesData)) {
      const qualityOrder = { "Source": 0, "720": 1, "540": 2, "360": 3 };
      const sorted = [...sourcesData].sort((a, b) =>
        (qualityOrder[a.name] ?? 99) - (qualityOrder[b.name] ?? 99)
      );
      for (const src of sorted) {
        if (src.src?.download) {
          rawVideoUrls.push({
            url: `https:${src.src.download}`,
            referer: "https://www.iwara.tv/",
            quality: src.name || "Unknown",
          });
        }
      }
    }
    console.log(`[Iwara Stream] Got ${rawVideoUrls.length} sources`);
    res.json({ rawVideoUrls, debug: debugInfo });
  } catch (err) {
    console.error("[Iwara Stream] Error:", err.message);
    // Return 200 with error field so frontend can log it instead of just 500 crash
    res.status(200).json({ error: err.message, rawVideoUrls: [] });
  }
});

// ==========================================
// HANIME.TV ROUTES
// ==========================================

// Trending/Latest
app.get("/api/hanime/trending", async (req, res) => {
  const { time = "month", page = 0 } = req.query;
  const url = `${HANIME_API}/browse/trending?time=${time}&page=${page}`;
  
  try {
    // Use fetchWithFallback to bypass ISP block on API metadata
    const jsonStr = await fetchWithFallback(url, { "User-Agent": getRandomUA() });
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search
app.get("/api/hanime/search", async (req, res) => {
  const { q, page = 0 } = req.query;
  
  try {
    const response = await fetch(HANIME_SEARCH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": getRandomUA()
      },
      body: JSON.stringify({
        search_text: q,
        tags: [],
        brands: [],
        blacklist: [],
        order_by: "views",
        ordering: "desc",
        page: parseInt(page)
      })
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Video Detail & Manifest
app.get("/api/hanime/video", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ID" });

  try {
    // Phase 1: Get basic metadata from v8 API
    const v8Url = `${HANIME_API}/video?id=${id}`;
    console.log(`[Hanime] Fetching Metadata: ${v8Url}`);
    const v8JsonStr = await fetchWithFallback(v8Url, { "User-Agent": getRandomUA() });
    const v8Data = JSON.parse(v8JsonStr);

    // Phase 2: Get the manifest from rapi/v7 (more reliable for streams)
    const slug = v8Data.hentai_video?.slug || id;
    const v7Url = `https://hanime.tv/rapi/v7/videos_manifests/${slug}`;
    
    console.log(`[Hanime] Fetching Manifest: ${v7Url}`);
    // Note: v7 manifest needs special headers, but fetchWithFallback might strip them
    // Let's try direct first since we have SSL Bypass, but keep proxy as fallback
    let v7Data;
    try {
      const v7Res = await fetchWithTimeout(v7Url, { headers: getHanimeV7Headers() });
      if (v7Res.ok) v7Data = await v7Res.json();
    } catch (e) {
      console.warn("[Hanime] V7 Direct failed, trying proxy (headers will be limited)...");
      // If direct fails, we use proxy, but it might fail because of signature mismatch 
      // if the proxy doesn't pass headers. However, some proxies do.
      const v7JsonStr = await fetchWithFallback(v7Url, getHanimeV7Headers());
      v7Data = JSON.parse(v7JsonStr);
    }

    // Merge v7 manifest into v8 data
    if (v7Data && !v8Data.videos_manifest) {
      v8Data.videos_manifest = v7Data;
    }

    res.json(v8Data);
  } catch (error) {
    console.error("[Hanime Detail Error]", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// CAVPORN SCRAPER (cav103.com)
// ==========================================

const parseCavPornVideos = (html) => {
  const $ = cheerio.load(html);
  const videos = [];

  // Strategy: find all elements that contain video links with thumbnails
  // The site uses .thumb-overlay or .img-holder wrapping the thumb
  // Look for container divs that hold both image + video link

  // Approach 1: Find all video link anchors
  $("a").each((i, el) => {
    const $el = $(el);
    const href = $el.attr("href") || "";

    // Match video links: /video/<id>/<slug>/
    const videoMatch = /\/video\/(\d+)\/([^/]+)\/?/.exec(href);
    if (!videoMatch) return;

    const id = videoMatch[1];
    const slug = videoMatch[2];

    // Skip if already found (duplicates from navigation)
    if (videos.find((v) => v.id === id)) return;

    // Extract thumbnail from multiple sources
    let thumbnail = "";

    // Try: img within the link
    const img = $el.find("img");
    if (img.length) {
      thumbnail =
        img.attr("data-src") ||
        img.attr("data-original") ||
        img.attr("data-thumb_url") ||
        img.attr("src") ||
        "";
    }

    // Try: parent container's img (sometimes thumb is sibling)
    if (!thumbnail) {
      const parent = $el.closest(
        ".video-item, .thumb-item, .item, .list-item, div",
      );
      if (parent.length) {
        const parentImg = parent.find("img").first();
        if (parentImg.length) {
          thumbnail =
            parentImg.attr("data-src") ||
            parentImg.attr("data-original") ||
            parentImg.attr("data-thumb_url") ||
            parentImg.attr("src") ||
            "";
        }
      }
    }

    // Try: data-preview attribute on the link itself
    if (!thumbnail) {
      thumbnail = $el.attr("data-preview") || $el.attr("data-src") || "";
    }

    // Try: style background-image
    if (!thumbnail) {
      const style = $el.attr("style") || "";
      const bgMatch = /url\(["']?([^"')]+)["']?\)/.exec(style);
      if (bgMatch) thumbnail = bgMatch[1];
    }

    // Clean up thumbnail URL
    if (thumbnail && !thumbnail.startsWith("http")) {
      thumbnail = CAVPORN_BASE + thumbnail;
    }
    // Filter out placeholder/lazy images
    if (
      thumbnail &&
      (thumbnail.includes("data:image") ||
        thumbnail.includes("blank.gif") ||
        thumbnail.includes("spacer"))
    ) {
      thumbnail = "";
    }

    // Extract title
    let title = "";
    const allText = $el.text().trim();
    const textParts = allText
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Filter out common non-title text (HD, duration, percentage)
    for (const part of textParts) {
      if (part === "HD" || part === "NEW") continue;
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(part)) continue; // duration
      if (/^\d+%$/.test(part)) continue; // rating
      if (/^\d+(\.\d+)?[KkMm]?$/.test(part)) continue; // views
      if (/^\d+[小时天周月年]/.test(part)) continue; // time ago
      if (/^\d+分钟前$/.test(part)) continue; // minutes ago
      if (part.length > 3) {
        title = part;
        break;
      }
    }

    // Extract duration
    let duration = "";
    const durationMatch = /(\d{1,2}:\d{2}(?::\d{2})?)/.exec(allText);
    if (durationMatch) duration = durationMatch[1];

    // Extract rating
    let rating = "";
    const ratingMatch = /(\d+)%/.exec(allText);
    if (ratingMatch) rating = ratingMatch[1] + "%";

    // Extract views - last number in text (like "78K", "143", "2.5K")
    let views = "";
    const allParts = allText.replace(/\s+/g, " ").trim();
    const viewsMatches = allParts.match(/(\d+(?:\.\d+)?[KkMm]?)\s*$/);
    if (viewsMatches) views = viewsMatches[1];

    // Only add if we have a valid title
    if (title && title.length > 3) {
      videos.push({
        id,
        slug,
        title,
        thumbnail: thumbnail
          ? `/api/proxy/image?url=${encodeURIComponent(thumbnail)}`
          : null,
        duration,
        rating,
        views,
        url: href.startsWith("http") ? href : `${CAVPORN_BASE}${href}`,
      });
    }
  });

  return videos;
};

// Latest Videos
app.get("/api/cavporn/latest", async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  // Try full page first (has proper thumbnails), then async as fallback
  const fullPageUrl =
    page > 1
      ? `${CAVPORN_BASE}/newvideo/${page}/`
      : `${CAVPORN_BASE}/newvideo/`;
  const asyncUrl = `${CAVPORN_BASE}/newvideo/?mode=async&function=get_block&block_id=list_videos_latest_videos_list&sort_by=post_date&from=${page}`;

  try {
    console.log(`[CavPorn] Fetching latest page ${page}`);
    let html;
    let videos = [];

    // Try full page first
    try {
      html = await fetchWithFallback(fullPageUrl, {
        "User-Agent": getRandomUA(),
        Referer: CAVPORN_BASE + "/",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      });
      videos = parseCavPornVideos(html);
      console.log(`[CavPorn] Full page found ${videos.length} videos`);
    } catch (e) {
      console.log(`[CavPorn] Full page failed, trying async...`);
    }

    // Fallback to async if full page returned no results
    if (videos.length === 0) {
      html = await fetchWithFallback(asyncUrl, {
        "User-Agent": getRandomUA(),
        Referer: CAVPORN_BASE + "/",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      });
      videos = parseCavPornVideos(html);
      console.log(`[CavPorn] Async found ${videos.length} videos`);
    }

    res.json(videos);
  } catch (error) {
    console.error("[CavPorn] Latest Error:", error.message);
    res.status(500).json({ error: "Failed to fetch CavPorn latest videos" });
  }
});

// Search Videos
app.get("/api/cavporn/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.json([]);

  const url = `${CAVPORN_BASE}/search/${encodeURIComponent(q)}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${encodeURIComponent(q)}&from=${page}`;

  try {
    console.log(`[CavPorn] Searching "${q}" page ${page}`);
    const html = await fetchWithFallback(url, {
      "User-Agent": getRandomUA(),
      Referer: CAVPORN_BASE + "/",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    });

    const videos = parseCavPornVideos(html);
    console.log(`[CavPorn] Search "${q}" found ${videos.length} results`);
    res.json(videos);
  } catch (error) {
    console.error("[CavPorn] Search Error:", error.message);
    res.status(500).json({ error: "Failed to search CavPorn" });
  }
});

// Categories List
app.get("/api/cavporn/categories", async (req, res) => {
  const url = `${CAVPORN_BASE}/categories/`;

  try {
    console.log("[CavPorn] Fetching categories");
    const html = await fetchWithFallback(url, {
      "User-Agent": getRandomUA(),
      Referer: CAVPORN_BASE + "/",
    });

    const $ = cheerio.load(html);
    const categories = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const catMatch = /\/categories\/([^/]+)\/?/.exec(href);
      if (!catMatch) return;

      const hash = catMatch[1];
      if (categories.find((c) => c.hash === hash)) return;

      // Extract name from the link text
      const textParts = $(el)
        .text()
        .trim()
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      let name = textParts[0] || "";
      let count = "";

      // Try to find video count (like "58322视频" or "视频" in text)
      const countMatch = /(\d+)\s*视频/.exec($(el).text());
      if (countMatch) count = countMatch[1];

      // Clean up name: remove "无头像" prefix
      name = name.replace(/^无头像\s*/, "").trim();

      if (name && name !== "相册" && name.length > 0) {
        categories.push({
          hash,
          name,
          count: count || "0",
          url: href.startsWith("http") ? href : `${CAVPORN_BASE}${href}`,
        });
      }
    });

    console.log(`[CavPorn] Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error("[CavPorn] Categories Error:", error.message);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Category Videos
app.get("/api/cavporn/category", async (req, res) => {
  const { hash, page = 1 } = req.query;
  if (!hash) return res.status(400).json({ error: "Missing category hash" });

  const url = `${CAVPORN_BASE}/categories/${hash}/?mode=async&function=get_block&block_id=list_videos_common_videos_list&sort_by=post_date&from=${page}`;

  try {
    console.log(`[CavPorn] Fetching category ${hash} page ${page}`);
    const html = await fetchWithFallback(url, {
      "User-Agent": getRandomUA(),
      Referer: `${CAVPORN_BASE}/categories/${hash}/`,
    });

    const videos = parseCavPornVideos(html);
    console.log(`[CavPorn] Category ${hash} found ${videos.length} videos`);
    res.json(videos);
  } catch (error) {
    console.error("[CavPorn] Category Error:", error.message);
    res.status(500).json({ error: "Failed to fetch category videos" });
  }
});

// Tags List
app.get("/api/cavporn/tags", async (req, res) => {
  const url = `${CAVPORN_BASE}/categories/`;

  try {
    console.log("[CavPorn] Fetching tags");
    const html = await fetchWithFallback(url, {
      "User-Agent": getRandomUA(),
      Referer: CAVPORN_BASE + "/",
    });

    const $ = cheerio.load(html);
    const tags = [];

    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const tagMatch = /\/tags\/([^/]+)\/?/.exec(href);
      if (!tagMatch) return;

      const hash = tagMatch[1];
      if (tags.find((t) => t.hash === hash)) return;

      const name = $(el).text().trim();
      if (name) {
        tags.push({
          hash,
          name,
          url: href.startsWith("http") ? href : `${CAVPORN_BASE}${href}`,
        });
      }
    });

    console.log(`[CavPorn] Found ${tags.length} tags`);
    res.json(tags);
  } catch (error) {
    console.error("[CavPorn] Tags Error:", error.message);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// Video Detail
app.get("/api/cavporn/detail", async (req, res) => {
  const { id, slug } = req.query;
  if (!id) return res.status(400).json({ error: "Missing video ID" });

  const videoSlug = slug || "";
  const url = `${CAVPORN_BASE}/video/${id}/${videoSlug}/`;

  try {
    console.log(`[CavPorn] Fetching detail: ${url}`);
    const html = await fetchWithFallback(url, {
      "User-Agent": getRandomUA(),
      Referer: CAVPORN_BASE + "/",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    });

    const $ = cheerio.load(html);

    // Title
    const title = $("h1").first().text().trim() || `Video ${id}`;

    // Extract video source from various patterns (KVS CMS site)
    let videoSrc = "";
    const allScripts = $("script")
      .map((i, el) => $(el).html())
      .get()
      .join("\n");

    // Strategy 1: Look for video tag source
    $("video source").each((i, el) => {
      const src = $(el).attr("src");
      if (src && !videoSrc) videoSrc = src;
    });

    // Strategy 2: KVS flashvars - video_url pattern
    if (!videoSrc) {
      const patterns = [
        /video_url\s*[:=]\s*['"]([^'"]+)['"]/,
        /video_alt_url\s*[:=]\s*['"]([^'"]+)['"]/,
        /video_url\s*[:=]\s*['"]([^'"]+\.m3u8[^'"]*)['"]/,
        /video_url\s*[:=]\s*['"]([^'"]+\.mp4[^'"]*)['"]/,
      ];
      for (const pattern of patterns) {
        const match = pattern.exec(allScripts);
        if (match && match[1]) {
          videoSrc = match[1];
          break;
        }
      }
    }

    // Strategy 3: kt_player function call
    if (!videoSrc) {
      const ktMatch = /kt_player\s*\([^,]*,\s*[^,]*,\s*\{([^}]+)\}/.exec(
        allScripts,
      );
      if (ktMatch) {
        const flashvarsStr = ktMatch[1];
        const urlMatch = /video_url\s*:\s*['"]([^'"]+)['"]/.exec(flashvarsStr);
        if (urlMatch) videoSrc = urlMatch[1];
      }
    }

    // Strategy 4: file: pattern (common in JW Player setups)
    if (!videoSrc) {
      const fileMatch = /file\s*:\s*['"]([^'"]+\.(?:m3u8|mp4)[^'"]*)['"]/i.exec(
        allScripts,
      );
      if (fileMatch) videoSrc = fileMatch[1];
    }

    // Strategy 5: sources array pattern
    if (!videoSrc) {
      const sourcesMatch =
        /sources\s*[:=]\s*\[\s*\{[^}]*(?:src|file|url)\s*:\s*['"]([^'"]+)['"]/i.exec(
          allScripts,
        );
      if (sourcesMatch) videoSrc = sourcesMatch[1];
    }

    // Strategy 6: Direct URL in any script (m3u8/mp4)
    if (!videoSrc) {
      const directMatch =
        /['"]((https?:\/\/[^'"]+\.(?:m3u8|mp4))[^'"]*)['"]/i.exec(allScripts);
      if (directMatch) videoSrc = directMatch[1];
    }

    // Strategy 7: Look in meta tags and data attributes
    if (!videoSrc) {
      const ogVideo =
        $('meta[property="og:video"]').attr("content") ||
        $('meta[property="og:video:url"]').attr("content") ||
        $('meta[name="twitter:player:stream"]').attr("content");
      if (ogVideo) videoSrc = ogVideo;
    }

    // Strategy 8: Look for function_format_number patterns (KVS license decoding)
    if (!videoSrc) {
      // KVS encodes URLs with license_code; try to find the raw URL
      const rawUrlMatch =
        /(?:video_url|rnd)\s*[:=]\s*['"]([A-Za-z0-9+/=]+)['"]/i.exec(
          allScripts,
        );
      if (rawUrlMatch) {
        // This might be base64 encoded
        try {
          const decoded = Buffer.from(rawUrlMatch[1], "base64").toString(
            "utf-8",
          );
          if (
            decoded.includes("http") ||
            decoded.includes(".m3u8") ||
            decoded.includes(".mp4")
          ) {
            videoSrc = decoded;
          }
        } catch (_e) {
          // Not base64, ignore
        }
      }
    }

    console.log(
      `[CavPorn] Video source extraction result: ${videoSrc ? videoSrc.substring(0, 100) + "..." : "NOT FOUND"}`,
    );
    console.log(
      `[CavPorn] Script content patterns found: ${allScripts.includes("video_url") ? "video_url " : ""}${allScripts.includes("kt_player") ? "kt_player " : ""}${allScripts.includes("flashvars") ? "flashvars " : ""}${allScripts.includes("m3u8") ? "m3u8 " : ""}${allScripts.includes(".mp4") ? "mp4 " : ""}`,
    );

    // Proxy the video URL if found
    let proxiedVideoSrc = "";
    if (videoSrc) {
      if (!videoSrc.startsWith("http")) {
        videoSrc = CAVPORN_BASE + videoSrc;
      }
      proxiedVideoSrc = `/api/proxy?url=${encodeURIComponent(videoSrc)}&referer=${encodeURIComponent(CAVPORN_BASE + "/")}`;
    }

    // Build embed URL as fallback (KVS sites have /embed/<id>/ endpoint)
    const embedUrl = `${CAVPORN_BASE}/embed/${id}/`;

    // Extract tags
    const tags = [];
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/tags/")) {
        const tagMatch = /\/tags\/([^/]+)\/?/.exec(href);
        if (tagMatch) {
          tags.push({
            hash: tagMatch[1],
            name: $(el).text().trim(),
          });
        }
      }
    });

    // Extract category
    let category = "";
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (href.includes("/categories/")) {
        const catMatch = /\/categories\/([^/]+)\/?/.exec(href);
        if (catMatch && !category) {
          category = $(el).text().trim();
        }
      }
    });

    // Extract related videos
    const relatedVideos = [];
    // Related are typically in the same page as links
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const videoMatch = /\/video\/(\d+)\/([^/]+)\/?/.exec(href);
      if (!videoMatch) return;

      const relId = videoMatch[1];
      const relSlug = videoMatch[2];

      // Skip the current video
      if (relId === id) return;
      if (relatedVideos.find((v) => v.id === relId)) return;
      if (relatedVideos.length >= 12) return;

      const img = $(el).find("img");
      let thumb =
        img.attr("data-src") ||
        img.attr("data-original") ||
        img.attr("data-thumb_url") ||
        img.attr("src") ||
        "";

      // Fallback: check style background-image on parent or itself
      if (!thumb) {
        const style =
          $(el).find(".img").attr("style") || $(el).attr("style") || "";
        const bgMatch = /url\(['"]?([^'"]+)['"]?\)/.exec(style);
        if (bgMatch) thumb = bgMatch[1];
      }

      const textParts = $(el)
        .text()
        .trim()
        .split(/\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      let relTitle = textParts[0] || "";

      let relDuration = "";
      const durMatch = /(\d{1,2}:\d{2}(?::\d{2})?)/.exec($(el).text());
      if (durMatch) relDuration = durMatch[1];

      if (relTitle && relTitle.length > 3) {
        relatedVideos.push({
          id: relId,
          slug: relSlug,
          title: relTitle,
          thumbnail: thumb
            ? `/api/proxy/image?url=${encodeURIComponent(thumb.startsWith("http") ? thumb : CAVPORN_BASE + thumb)}&referer=${encodeURIComponent(CAVPORN_BASE + "/")}`
            : null,
          duration: relDuration,
        });
      }
    });

    // Download link
    const downloadUrl = `${CAVPORN_BASE}/download.php?id=${id}`;

    res.json({
      id,
      slug: videoSlug,
      title,
      videoSrc: proxiedVideoSrc,
      rawVideoSrc: videoSrc,
      embedUrl,
      tags,
      category,
      relatedVideos,
      downloadUrl,
      originalUrl: url,
    });
  } catch (error) {
    console.error("[CavPorn] Detail Error:", error.message);
    res.status(500).json({ error: "Failed to fetch video detail" });
  }
});

// CavPorn Video Player - HLS.js player with backend proxy
// Accepts a direct video URL (extracted by /api/cavporn/detail)
app.get("/api/cavporn/player", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing video URL");

  console.log(`[CavPorn Player] Playing: ${url.substring(0, 80)}...`);

  const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
  const referer = CAVPORN_BASE + "/";
  const isHLS = url.includes(".m3u8");

  const playerHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#000;overflow:hidden;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center}
    video{width:100%;height:100%;object-fit:contain}
    .loading{color:#fff;font-family:sans-serif;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
  </style>
  ${isHLS ? '<script src="/api/proxy?url=' + encodeURIComponent("https://cdn.jsdelivr.net/npm/hls.js@1.5.7/dist/hls.min.js") + '"><\\/script>' : ""}
</head>
<body>
  <div class="loading" id="loader">Loading video...</div>
  <video id="player" controls autoplay playsinline></video>
  <script>
    var rawUrl = decodeURIComponent("${encodeURIComponent(url)}");
    var baseUrl = decodeURIComponent("${encodeURIComponent(baseUrl)}");
    var referer = decodeURIComponent("${encodeURIComponent(referer)}");
    var video = document.getElementById("player");
    var loader = document.getElementById("loader");

    function proxyUrl(u) {
      var abs = u;
      if (!u.startsWith("http")) {
        abs = u.startsWith("/") ? "${CAVPORN_BASE}" + u : baseUrl + u;
      }
      return "/api/proxy?url=" + encodeURIComponent(abs) + "&referer=" + encodeURIComponent(referer);
    }

    function hideLoader() { loader.style.display = "none"; }
    video.addEventListener("playing", hideLoader);
    video.addEventListener("loadeddata", hideLoader);

    ${
      isHLS
        ? `
    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      var hls = new Hls({
        xhrSetup: function(xhr, xhrUrl) {
          // The proxy endpoint rewrites m3u8 content so segment URLs are already proxied.
          // Don't re-proxy URLs that are already going through our proxy.
          var finalUrl = xhrUrl;
          if (xhrUrl.indexOf("/api/proxy") !== -1) {
            // Already a proxy URL (from m3u8 rewriting) - extract just the path
            if (xhrUrl.startsWith("http")) {
              // The proxy rewrites to https://host/api/proxy?url=... - extract path
              try { finalUrl = new URL(xhrUrl).pathname + new URL(xhrUrl).search; } catch(e) { finalUrl = xhrUrl; }
            }
            // else it's already a relative /api/proxy URL, use as-is
          } else {
            // Not yet proxied - proxy it
            finalUrl = proxyUrl(xhrUrl);
          }
          console.log("HLS fetch:", xhrUrl.substring(0, 60), "->", finalUrl.substring(0, 60));
          xhr.open("GET", finalUrl, true);
        },
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 90
      });
      hls.loadSource(proxyUrl(rawUrl));
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        console.log("HLS manifest loaded, starting playback");
        video.play().catch(function(e){ console.log("Autoplay blocked:", e); });
      });
      hls.on(Hls.Events.ERROR, function(ev, data) {
        console.error("HLS Error:", data.type, data.details);
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.log("Recovering from media error...");
            hls.recoverMediaError();
          } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            console.log("Network error, retrying...");
            setTimeout(function(){ hls.startLoad(); }, 1000);
          } else {
            console.log("Fatal error, trying direct load");
            hls.destroy();
            video.src = proxyUrl(rawUrl);
            video.play().catch(function(){});
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = proxyUrl(rawUrl);
      video.play().catch(function(){});
    } else {
      loader.textContent = "HLS not supported in this browser";
    }`
        : `
    video.src = proxyUrl(rawUrl);
    video.play().catch(function(){});
    `
    }
  <\\/script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(playerHtml);
});

// Serve frontend files (for Render / Railway deployment)
const distPath = path.join(__dirname, "../dist");
app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Always listen (Render/Railway need this)
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export default app;
