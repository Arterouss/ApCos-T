import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { Buffer } from "buffer";

const app = express();
const PORT = 3001;

app.use(cors());

// Proxy endpoint for creators
app.get("/api/creators", async (req, res) => {
  try {
    console.log("Fetching creators from Kemono API...");

    const response = await fetch("https://kemono.cr/api/v1/creators", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/css",
        Referer: "https://kemono.cr/",
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
      `https://kemono.cr/api/v1/${service}/user/${id}/posts`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/css",
          Referer: "https://kemono.cr/",
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

// --- BUNKR SCRAPER Integration ---
const BUNKR_BASE_URL = "https://bunkr.si"; // Changed from bunkr-albums.io to .si mirror
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1",
];
const getRandomUA = () => UAS[Math.floor(Math.random() * UAS.length)];

// Helper headers
const getNekoHeaders = (referer = BUNKR_BASE_URL) => ({
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
      const res = await fetch(targetUrl, { headers: defaultHeaders });

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
    const res = await fetch(proxyUrl, { headers: defaultHeaders });
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
    const res = await fetch(proxyUrl, { headers: defaultHeaders });
    if (res.ok) return await res.text();
    lastError = `CodeTabs: ${res.status}`;
  } catch (e) {
    lastError = e.message;
  }

  await delay(500);

  // 4. AllOrigins (Returns JSON { contents: "..." })
  try {
    console.log(`[Proxy] AllOrigins: ${targetUrl}`);
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { headers: defaultHeaders });
    if (res.ok) {
      const data = await res.json();
      if (data.contents) return data.contents;
    }
    lastError = `AllOrigins: ${res.status}`;
  } catch (e) {
    lastError = e.message;
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

  try {
    let response;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (referer) {
      headers["Referer"] = referer;
    }

    // 1. Try Direct Fetch
    try {
      response = await fetch(url, { headers });
    } catch (directError) {
      console.warn(
        `[Image Proxy] Direct fetch network error: ${directError.message}`,
      );
    }

    // Retry with origin as referer if 403
    if (response && response.status === 403) {
      try {
        const targetOrigin = new URL(url).origin;
        headers["Referer"] = targetOrigin + "/";
        response = await fetch(url, { headers });
      } catch (e) {
        // ignore
      }
    }

    // 2. If blocked/failed, try wsrv.nl
    if (!response || !response.ok || response.status === 403) {
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
      // console.log(`[Image Proxy] Try wsrv: ${proxyUrl}`);
      try {
        response = await fetch(proxyUrl);
      } catch (e) {
        console.warn(`[Image Proxy] wsrv network error: ${e.message}`);
      }
    }

    // 3. If wsrv failed, try CodeTabs (No Headers)
    if (!response || !response.ok) {
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
      // console.log(`[Image Proxy] Try CodeTabs: ${proxyUrl}`);
      try {
        response = await fetch(proxyUrl);
      } catch (e) {
        console.warn(`[Image Proxy] CodeTabs network error: ${e.message}`);
        response = undefined;
      }
    }

    // 4. If CodeTabs failed, try AllOrigins (No Headers)
    if (!response || !response.ok) {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      // console.log(`[Image Proxy] Try AllOrigins: ${proxyUrl}`);
      try {
        response = await fetch(proxyUrl);
      } catch (e) {
        console.warn(`[Image Proxy] AllOrigins network error: ${e.message}`);
        response = undefined;
      }
    }

    if (!response || !response.ok)
      throw new Error(
        `Image fetch failed: ${response ? response.status : "No response"}`,
      );

    const contentType = response.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // Cache for performance (1 day)
    res.setHeader("Cache-Control", "public, max-age=86400");

    response.body.pipe(res);
  } catch (error) {
    console.error("Image Proxy Error:", error.message);
    res.status(500).send(`Error fetching image: ${error.message}`);
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

    let url;
    if (q) {
      url = `${BUNKR_BASE_URL}/?search=${encodeURIComponent(q)}&page=${page}`;
    } else {
      url =
        page > 1
          ? `${BUNKR_BASE_URL}/?search=&page=${page}`
          : `${BUNKR_BASE_URL}/`;
    }

    console.log(`[Proxy] Fetching: ${url}`);

    let html = "";
    try {
      html = await fetchWithFallback(url, getNekoHeaders(url));
    } catch (e) {
      console.error(`[Proxy] Search Failed: ${e.message}`);
    }

    if (!html) {
      return res.status(500).json({
        error: "Upstream Error",
        details: "Failed to retrieve content from Bunkr",
      });
    }

    // --- BUNKR SEARCH PARSING (CHEERIO) ---
    const $ = cheerio.load(html);
    const hits = [];

    console.log(`[Proxy] HTML length: ${html.length} characters`);
    console.log(`[Proxy] Testing selectors...`);

    // Debug: Count various potential elements
    console.log(`  - Links with /a/: ${$("a[href*='/a/']").length}`);
    console.log(`  - All links: ${$("a").length}`);
    console.log(
      `  - Divs with 'rounded': ${$("div[class*='rounded']").length}`,
    );

    // Strategy 1: Find ALL links and filter for /a/ pattern
    $("a").each((i, el) => {
      const link = $(el);
      const href = link.attr("href");

      if (!href || !href.includes("/a/")) return;

      const slugMatch = /\/a\/([a-zA-Z0-9_-]+)/.exec(href);
      if (!slugMatch) return;

      const slug = slugMatch[1];

      // Check duplicates
      if (hits.find((h) => h.slug === slug)) return;

      // Try to find title from link text or parent container
      let title = link.text().trim();

      if (!title || title.length < 3) {
        // Look in parent for text
        const parent = link.parent();
        title = parent.find("span, p, h1, h2, h3, h4").first().text().trim();
      }

      if (!title || title.length < 3) {
        title = `Album ${slug}`;
      }

      hits.push({
        id: slug,
        slug: slug,
        name: title,
        cover_url: "https://static.bunkr.ru/img/logo_bunkr-9Kl5M1Y.svg",
        poster_url: "https://static.bunkr.ru/img/logo_bunkr-9Kl5M1Y.svg",
        views: 0,
        tags: ["Bunkr Album"],
        original_url: href.startsWith("http")
          ? href
          : `https://bunkr.cr${href}`,
      });
    });

    // Fallback regex if cheerio fails to find specific structure but valid HTML exists
    if (hits.length === 0) {
      console.log("[Proxy] Cheerio found no hits, trying regex fallback...");

      // Look for any href="/a/SLUG" or href="https://bunkr.*/a/SLUG"
      const linkRegex =
        /href=["']((?:https?:\/\/[^"']*)?\/a\/([a-zA-Z0-9_-]+))["']/g;
      let match;
      const foundSlugs = new Set();

      while ((match = linkRegex.exec(html)) !== null) {
        const fullUrl = match[1];
        const slug = match[2];

        if (foundSlugs.has(slug)) continue;
        foundSlugs.add(slug);

        hits.push({
          id: slug,
          slug: slug,
          name: `Album ${slug}`,
          cover_url: "https://static.bunkr.ru/img/logo_bunkr-9Kl5M1Y.svg",
          poster_url: "https://static.bunkr.ru/img/logo_bunkr-9Kl5M1Y.svg",
          views: 0,
          tags: ["Regex Fallback"],
          original_url: fullUrl.startsWith("http")
            ? fullUrl
            : `https://bunkr.cr${fullUrl}`,
        });
      }
    }

    console.log(`[Proxy] Parsed ${hits.length} hits. (Page ${page})`);

    res.json({
      hits: JSON.stringify(hits),
      page: parseInt(page) || 0,
      nbPages: 50,
      hitsPerPage: hits.length,
    });
  } catch (err) {
    console.error(`[Proxy] Search Error:`, err);
    res
      .status(500)
      .json({ error: "Failed to fetch data", details: err.message });
  }
});

// Video Details Endpoint (Scraper)
app.get(/^\/api\/hnime\/video\/(.*)$/, async (req, res) => {
  const slug = req.params[0];

  try {
    // Album URLs are on bunkr.cr, not bunkr-albums.io
    let targetUrl = `https://bunkr.cr/a/${slug}`;
    console.log(`[Bunkr] Scraping Video: ${targetUrl}`);

    let html = "";
    try {
      html = await fetchWithFallback(targetUrl, getNekoHeaders(targetUrl));
    } catch (e) {
      if (!slug.endsWith("/")) {
        console.log("[Bunkr] Retrying with trailing slash...");
        targetUrl = `https://bunkr.cr/a/${slug}/`;
        try {
          html = await fetchWithFallback(targetUrl, getNekoHeaders(targetUrl));
        } catch (finalErr) {
          console.error("[Bunkr] Final Retry Failed:", finalErr);
        }
      }
    }

    if (!html) throw new Error("Failed to retrieve content from Bunkr.");

    // --- BUNKR ALBUM & FILE PARSING (CHEERIO) ---
    const $ = cheerio.load(html);
    const title = $("h1").first().text().trim() || `Album ${slug}`;

    const files = [];

    // Select all file items
    // Structure: <div class="relative group/item theItem ...">
    $("div.relative.group\\/item.theItem").each((i, el) => {
      const $el = $(el);
      const link = $el.find("a[href*='/f/']").first();
      const thumb = $el.find("img.grid-images_box-img").attr("src");
      // name often in a p tag
      // Use a broad search for name if exact class is unknown/dynamic
      let name = $el.find("p.text-[13px], p.truncate").text().trim();
      if (!name) name = link.text().trim();

      const href = link.attr("href");
      if (href) {
        const fileSlugMatch = /\/f\/([a-zA-Z0-9]+)/.exec(href);
        if (fileSlugMatch) {
          files.push({
            slug: fileSlugMatch[1],
            name: name || "Unknown File",
            thumb: thumb || "",
          });
        }
      }
    });

    res.json({
      id: slug,
      slug: slug,
      name: title,
      files: files,
    });
  } catch (e) {
    console.error("[Bunkr/Hnime] Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Bunkr Detail Endpoint
app.get("/api/bunkr/detail", async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Slug is required" });

  try {
    // Try domains until one works
    const domains = [
      "https://bunkr.cr",
      "https://bunkr.si",
      "https://bunkr.ph",
      "https://bunkr.la",
    ];
    let html = null;
    let usedDomain = "";

    for (const domain of domains) {
      try {
        const url = `${domain}/a/${slug}`;
        console.log(`[Bunkr] Trying detail: ${url}`);
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
        console.warn(`[Bunkr] Failed ${domain}: ${e.message}`);
      }
    }

    if (!html || !usedDomain) {
      throw new Error("Album not found on any Bunkr domain");
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

    console.log(`[Bunkr] Found ${files.length} files in album.`);

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
        console.log(`[Bunkr] Extracting raw video from: ${filePageUrl}`);
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
      description: "Scraped from Bunkr via Reddit",
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
    console.error("Bunkr Detail Error:", err.message);
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
      try {
        // Fallback: CorsProxy.io
        // Note: CorsProxy might not support Range headers effectively, but it's better than nothing.
        const fallbackUrl = `https://corsproxy.io/?${encodeURIComponent(decodedUrl)}`;
        // We drop the custom headers for the fallback to avoid CORS preflight issues or filtering
        response = await fetch(fallbackUrl);
        console.log(`[Proxy] Fallback Status: ${response.status}`);
      } catch (fallbackErr) {
        console.error(`[Proxy] Fallback Error: ${fallbackErr.message}`);
        // If fallback also fails, we must return the original error or 500
        if (!response)
          return res.status(500).send("Proxy Error: " + fallbackErr.message);
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

app.get("/", (req, res) => {
  res.send("ApiCos Proxy Server is Running");
});

// --- E-HENTAI SCRAPER Integration ---
const EHENTAI_BASE_URL = "https://e-hentai.org";

// Search Endpoint
app.get("/api/ehentai/search", async (req, res) => {
  try {
    let { q, page, f_cats } = req.query;
    page = parseInt(page) || 0; // EH uses page=0 for first page

    let url = `${EHENTAI_BASE_URL}/?page=${page}`;
    if (q) url += `&f_search=${encodeURIComponent(q)}`;
    if (f_cats) url += `&f_cats=${f_cats}`;

    console.log(`[EHentai] Scraping: ${url}`);

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    let html = "";
    let response = await fetch(url, { headers });
    if (response.ok) {
      html = await response.text();
    }

    // Fallback if blocked
    if (!response.ok || html.includes("IP limit") || !html) {
      console.warn("[EHentai] Direct fetch failed/blocked. Trying Proxy...");
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      html = await response.text();
    }
    const galleries = [];

    // Parse Table Rows
    const trRegex = /<tr class="gtr\d+">([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(html)) !== null) {
      const row = trMatch[1];

      // Extract URL & ID ( /g/123/token/ )
      const urlMatch = /href="https:\/\/e-hentai\.org\/g\/(\d+)\/(\w+)\/"/.exec(
        row,
      );
      if (!urlMatch) continue;
      const [fullUrl, id, token] = urlMatch;

      // Extract Title
      const titleMatch = /<div class="glink">([^<]+)<\/div>/.exec(row);
      const title = titleMatch ? titleMatch[1] : "Untitled";

      // Extract Thumb (src or data-src)
      const thumbMatch = /<img[^>]+(?:src|data-src)=['"]([^'"]+)['"]/.exec(row);
      const thumb = thumbMatch ? thumbMatch[1] : "";

      // Extract Category
      const catMatch = /<div class="cn">([^<]+)<\/div>/.exec(row);
      const category = catMatch ? catMatch[1] : "Misc";

      galleries.push({
        id,
        token,
        title,
        thumb,
        category,
        url: `https://e-hentai.org/g/${id}/${token}/`,
      });
    }

    console.log(`[EHentai] Found ${galleries.length} items`);
    res.json({ data: galleries, page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Gallery Detail Endpoint
app.get("/api/ehentai/gallery/:id/:token", async (req, res) => {
  try {
    const { id, token } = req.params;
    const { p } = req.query; // Page number
    const page = p || 0;

    const targetUrl = `${EHENTAI_BASE_URL}/g/${id}/${token}/?p=${page}`;
    console.log(`[EHentai] Scraping Gallery: ${targetUrl}`);

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    let html = "";
    let response = await fetch(targetUrl, { headers });
    if (response.ok) {
      html = await response.text();
    }

    if (!response.ok || html.includes("IP limit") || !html) {
      console.warn("[EHentai] Direct fetch failed. Trying Proxy...");
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Failed to fetch gallery");
      html = await response.text();
    }

    // Extract Title (English or Japanese)
    const titleMatch = /<h1 id="gn">([^<]+)<\/h1>/.exec(html);
    const title = titleMatch ? titleMatch[1] : `Gallery ${id}`;

    // Extract Tags
    const tags = [];
    const tagRegex = /<div class="gt"[^>]*>([^<]+)<\/div>/g;
    let tMatch;
    while ((tMatch = tagRegex.exec(html)) !== null) {
      tags.push(tMatch[1]);
    }

    // Extract Images (Thumbnails + Reader Links)
    const images = [];
    // Regex matches the standard 'gdtm' (Mosaic) layout
    const imgBlockRegex =
      /<div class="gdtm"[^>]*>[\s\S]*?<a href="([^"]+)"[\s\S]*?background:transparent url\(([^)]+)\)/g;

    let imgMatch;
    while ((imgMatch = imgBlockRegex.exec(html)) !== null) {
      const [_, readerUrl, thumbUrl] = imgMatch;
      images.push({
        readerUrl,
        thumbUrl,
        page: readerUrl.split("-").pop(),
      });
    }

    // Standard meta info (Total pages?)
    // td class="gdt2" contains e.g. "42 pages"
    const lengthMatch = /<td class="gdt2">(\d+) pages<\/td>/.exec(html);
    const totalPages = lengthMatch ? parseInt(lengthMatch[1]) : 0;

    res.json({
      id,
      token,
      title,
      tags,
      images,
      page,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Reader Endpoint (Get Full Image)
app.get("/api/ehentai/reader", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) throw new Error("Missing url param");

    console.log(`[EHentai] Scraping Reader: ${url}`);

    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const html = await response.text();

    // Extract Image Src
    // <img id="img" src="..." ... />
    const imgMatch = /<img id="img" src="([^"]+)"/.exec(html);
    if (!imgMatch) throw new Error("Image source not found");

    res.json({ imageUrl: imgMatch[1] });
  } catch (err) {
    console.error(err);
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
// NEKOPOI API
// ==========================================

const parseNekopoiPosts = ($) => {
  const posts = [];
  // Strategy: Try multiple selectors.
  let items = $(".eropost");
  if (items.length === 0) items = $("article.post");
  if (items.length === 0) items = $(".result-item");

  items.each((i, el) => {
    const $el = $(el);
    let titleEl = $el.find("h2 a");
    if (titleEl.length === 0) titleEl = $el.find(".title a");

    let imgEl = $el.find("img");

    const title = titleEl.text().trim();
    const url = titleEl.attr("href");
    const thumb =
      imgEl.attr("src") ||
      imgEl.attr("data-src") ||
      imgEl.attr("data-lazy-src");

    const slug = url ? url.split("/").filter(Boolean).pop() : null;

    if (title && url) {
      posts.push({
        id: slug,
        slug,
        title,
        thumbnail: thumb
          ? `/api/proxy/image?url=${encodeURIComponent(thumb)}`
          : null,
        url,
      });
    }
  });
  return posts;
};

app.get("/api/nekopoi/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q)
    return res.status(400).json({ error: "Query parameter 'q' is required" });

  try {
    const url = `https://nekopoi.care/search/${encodeURIComponent(q)}/page/${page}`;
    console.log(`[Nekopoi] Searching: ${url}`);

    // Force Proxy (skipDirect = true) to bypass ISP blocks
    const html = await fetchWithFallback(url, {}, true);
    const $ = cheerio.load(html);
    const posts = parseNekopoiPosts($); // Re-use the existing parser function!

    console.log(`[Nekopoi] Search found ${posts.length} items`);
    res.json(posts);
  } catch (error) {
    console.error("Nekopoi Search Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/nekopoi/latest", async (req, res) => {
  const page = req.query.page || 1;
  const url =
    page > 1 ? `https://nekopoi.care/page/${page}/` : `https://nekopoi.care/`;

  try {
    // Force Proxy (skipDirect = true) to bypass ISP blocks
    const html = await fetchWithFallback(url, {}, true);
    const $ = cheerio.load(html);
    const posts = parseNekopoiPosts($);
    res.json(posts);
  } catch (error) {
    console.error("Nekopoi Latest Error:", error.message);
    res.status(500).json({ error: "Failed to fetch Nekopoi data" });
  }
});

app.get("/api/nekopoi/detail", async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Slug required" });

  const url = `https://nekopoi.care/${slug}/`;

  try {
    // Force Proxy (skipDirect = true) to bypass ISP blocks
    const html = await fetchWithFallback(url, {}, true);
    const $ = cheerio.load(html);

    const title =
      $("h1.entry-title").text().trim() || $("h1.title").text().trim();
    const images = [];

    // Extract Stream
    let videoIframes = [];
    let rawVideoUrls = [];
    const iframePromises = [];

    // Strategy 1: Look for iframes (streams)
    $("iframe").each((i, el) => {
      const src = $(el).attr("src");
      if (src) {
        // Try to proxy it if it looks like a stream
        videoIframes.push(`/api/proxy/cossora?url=${encodeURIComponent(src)}`);

        // also try to extract raw video URL for HLS player
        const p = (async () => {
          try {
            const iframeHtml = await fetchWithFallback(
              src,
              {
                Referer: "https://nekopoi.care/",
              },
              true,
            );

            // 1. Try Packer unpacking
            if (iframeHtml.includes("eval(function(p,a,c,k,e,d)")) {
              const packedMatch =
                /eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/.exec(
                  iframeHtml,
                );
              if (packedMatch) {
                const unpacked = unpack(packedMatch[0]);
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

            // 3. Try generic file: pattern
            const fileMatch = /file\s*:\s*["']([^"']+)["']/.exec(iframeHtml);
            if (fileMatch && fileMatch[1]) {
              const vUrl = fileMatch[1];
              if (vUrl.includes(".m3u8") || vUrl.includes(".mp4")) {
                rawVideoUrls.push({
                  url: vUrl,
                  referer: new URL(src).origin + "/",
                });
              }
            }
          } catch (e) {
            console.warn(
              `[Nekopoi] Failed to extract raw video from ${src}: ${e.message}`,
            );
          }
        })();
        iframePromises.push(p);
      }
    });

    // Strategy 2: Look for 'video' tag
    $("video source").each((i, el) => {
      const src = $(el).attr("src");
      if (src) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(src)}&referer=${encodeURIComponent("https://nekopoi.care/")}`;
        videoIframes.push(proxyUrl);
        rawVideoUrls.push({
          url: src,
          referer: "https://nekopoi.care/",
        });
      }
    });

    // Strategy 3: Look for stream scripts
    const scriptContent = $("script").text();
    const fileMatch = /file:\s*["']([^"']+)["']/.exec(scriptContent);
    if (fileMatch && fileMatch[1]) {
      const src = fileMatch[1];
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(src)}&referer=${encodeURIComponent("https://nekopoi.care/")}`;
      videoIframes.push(proxyUrl);
      rawVideoUrls.push({
        url: src,
        referer: "https://nekopoi.care/",
      });
    }

    if (iframePromises.length > 0) {
      await Promise.allSettled(iframePromises);
    }

    // Remove duplicates
    rawVideoUrls = rawVideoUrls.filter(
      (v, i, self) => i === self.findIndex((t) => t.url === v.url),
    );

    // Extract Content Images
    $(".entry-content img, .content img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) images.push(`/api/proxy/image?url=${encodeURIComponent(src)}`);
    });

    // Extract Download Links
    const downloadLinks = [];
    $("a").each((i, el) => {
      const txt = $(el).text().trim().toLowerCase();
      const href = $(el).attr("href");
      if (
        href &&
        (txt.includes("download") ||
          txt.includes("zippyshare") ||
          txt.includes("gdrive"))
      ) {
        downloadLinks.push({ label: $(el).text().trim(), url: href });
      }
    });

    res.json({
      title,
      images,
      videoIframes,
      rawVideoUrls, // Added this field
      downloadLinks,
      originalUrl: url,
    });
  } catch (error) {
    console.error("Nekopoi Detail Error:", error.message);
    res.status(500).json({ error: "Failed to fetch detail" });
  }
});

// ==========================================
// CAVPORN SCRAPER (cav103.com)
// ==========================================
const CAVPORN_BASE = "https://cav103.com";

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

// Start Server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
