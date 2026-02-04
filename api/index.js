import express from "express";
import cors from "cors";
import fetch from "node-fetch";

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
const BUNKR_BASE_URL = "https://bunkr-albums.io";
const NEKOPOI_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Helper headers
const getNekoHeaders = (referer = BUNKR_BASE_URL) => ({
  "User-Agent": NEKOPOI_UA,
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

// Search & Latest Endpoint (Scraper)
app.get("/api/hnime/search", async (req, res) => {
  try {
    let { q, page } = req.query;
    page = parseInt(page) || 1;

    let url;
    if (q) {
      // Correct Format: https://bunkr-albums.io/?search=query&page=1
      url = `${BUNKR_BASE_URL}/?search=${encodeURIComponent(q)}&page=${page}`;
    } else {
      // Format: https://bunkr-albums.io/page/2/ (or /?page=2 might work too, but /page/2/ is standard for recent posts)
      // Let's check navigation links in dump. <a href='/?search=&page=2'>
      // So even for browsing, it seems to support query params.
      // But standard homepage is just /.
      url =
        page > 1
          ? `${BUNKR_BASE_URL}/?search=&page=${page}`
          : `${BUNKR_BASE_URL}/`;
    }

    console.log(`[Proxy] Request: q='${q || ""}', page=${page}`);
    console.log(`[Proxy] Fetching: ${url}`);

    let html = "";
    // Pass URL as referer
    let response = await fetch(url, {
      headers: getNekoHeaders(url),
    });

    console.log(`[Proxy] Response Status: ${response.status}`);

    // Log headers for debugging Vercel issues
    if (!response.ok) {
      console.warn(
        `[Proxy] Failed Headers:`,
        JSON.stringify(response.headers.raw()),
      );
    }

    if (response.ok) {
      html = await response.text();
    }

    // Fallback Proxy Strategy if blocked/403/404
    if (
      !response.ok ||
      html.includes("Just a moment") ||
      html.includes("Cloudflare")
    ) {
      console.warn(
        `[Bunkr Search] Blocked/Error (${response.status}). Switching to AllOrigins Proxy...`,
      );
      try {
        // Use CorsProxy.io
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const pRes = await fetch(proxyUrl);
        if (pRes.ok) {
          const pText = await pRes.text();
          if (pText && pText.includes("class")) {
            html = pText;
            console.log("[Bunkr Search] Proxy (CorsProxy) fetch success.");
          }
        }
      } catch (err) {
        console.error("Proxy Fallback Failed:", err);
      }
    }

    // Return empty if 404 on page > 1 (Pagination end)
    if (!html && response.status === 404 && page > 1) {
      return res.json({
        hits: JSON.stringify([]),
        page,
        nbPages: page,
        hitsPerPage: 0,
      });
    }

    // If still no HTML, return error
    if (!html) {
      const errText = !response.ok ? await response.text() : "Empty Response";
      console.error(
        `[Proxy Error] Status: ${response.status}, Body: ${errText.substring(
          0,
          200,
        )}`,
      );
      return res.status(response.status || 500).json({
        error: "Upstream Error",
        details: `Bunkr ${response.status}`,
        body: errText.substring(0, 500),
      });
    }

    // --- BUNKR SEARCH PARSING ---
    // Structure:
    // <div class='rounded-xl bg-mute ...'>
    //   <p class='text-subs ...'><span class='truncate'>TITLE</span></p>
    //   ... <a class='ic-chevron-right ...' href='https://bunkr.cr/a/SLUG'></a>
    // </div>

    const hits = [];

    // Regex to capture Title and URL
    // <span class='truncate'>...</span> ... href='.../a/SLUG'
    // Matches across lines potentially, but usually in one block.
    // Using a simpler approach: extract all blocks, then parse each block.

    // 1. Split into Album Blocks
    const albumBlocks = html.split("class='rounded-xl bg-mute");
    // Skip the first split as it's before the first album

    for (let i = 1; i < albumBlocks.length; i++) {
      const block = albumBlocks[i];

      // Extract Title
      const titleMatch = /class='truncate'>([^<]+)</.exec(block);
      const title = titleMatch ? titleMatch[1].trim() : "Untitled";

      // Extract Album URL / Slug
      const hrefMatch = /href=['"]([^'"]+)['"]/.exec(block);
      const rawUrl = hrefMatch ? hrefMatch[1] : "";

      if (!rawUrl) continue;

      // Parse Slug (https://bunkr.cr/a/xyz -> xyz)
      const slugMatch = /\/a\/([a-zA-Z0-9]+)/.exec(rawUrl);
      const slug = slugMatch ? slugMatch[1] : rawUrl;

      // Bunkr Search doesn't show thumbnails! Use a placeholder.
      const thumb = "https://static.bunkr.ru/img/logo_bunkr-9Kl5M1Y.svg";

      hits.push({
        id: slug,
        slug: slug,
        name: title,
        cover_url: thumb,
        poster_url: thumb,
        views: 0,
        tags: ["Bunkr Album"],
        original_url: rawUrl,
      });
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

    // Helper: Try to fetch from multiple sources
    const fetchWithFallback = async (targetUrl) => {
      let lastError;

      // 1. Direct Fetch
      try {
        console.log(`[Bunkr] Attempting Direct: ${targetUrl}`);
        const res = await fetch(targetUrl, {
          headers: getNekoHeaders(targetUrl),
        });
        if (res.ok) return await res.text();
        console.warn(`[Bunkr] Direct failed: ${res.status}`);
        lastError = `Direct: ${res.status}`;
      } catch (e) {
        console.warn(`[Bunkr] Direct error: ${e.message}`);
        lastError = e.message;
      }

      // 2. CorsProxy.io
      try {
        // Append random param to avoid cache
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
        console.log(`[Bunkr] Attempting CorsProxy: ${proxyUrl}`);
        const res = await fetch(proxyUrl);
        if (res.ok) return await res.text();
        console.warn(`[Bunkr] CorsProxy failed: ${res.status}`);
      } catch (e) {
        console.warn(`[Bunkr] CorsProxy error: ${e.message}`);
      }

      // 3. AllOrigins (Returns JSON { contents: "..." })
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
        console.log(`[Bunkr] Attempting AllOrigins: ${proxyUrl}`);
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.contents) return data.contents;
        }
      } catch (e) {
        console.warn(`[Bunkr] AllOrigins error: ${e.message}`);
      }

      throw new Error(`All Fetch Attempts Failed. Last error: ${lastError}`);
    };

    try {
      html = await fetchWithFallback(targetUrl);
    } catch (e) {
      // Retry with trailing slash if original URL didn't have one
      if (!slug.endsWith("/")) {
        console.log("[Bunkr] Retrying with trailing slash...");
        targetUrl = `https://bunkr.cr/a/${slug}/`;
        try {
          html = await fetchWithFallback(targetUrl);
        } catch (finalErr) {
          console.error("[Bunkr] Final Retry Failed:", finalErr);
        }
      }
    }

    if (!html) throw new Error("Failed to retrieve content from Bunkr.");

    // --- BUNKR ALBUM & FILE PARSING ---

    // 1. Fetch Album to get File List
    // TargetUrl is already fetched above (https://bunkr.cr/a/SLUG)

    // Extract Album Title
    const titleMatch = /<h1[^>]*>([^<]+)<\/h1>/i.exec(html);
    const title = titleMatch ? titleMatch[1].trim() : `Album ${slug}`;

    // Parse Files in Album
    // HTML structure: <div class="relative group/item theItem" ...>
    // Use Regex to split, handling potential quote differences
    const files = [];
    const fileBlocks = html.split(/class=["']relative group\/item theItem["']/);

    for (let i = 1; i < fileBlocks.length; i++) {
      const block = fileBlocks[i];

      // Thumb: Look for the specific image class to avoid icons
      const thumbMatch =
        /class=["']grid-images_box-img["'][^>]*src=["']([^"']+)["']/.exec(
          block,
        );

      // Name: <p class="...theName...">Name</p>
      const nameMatch = /class=["'][^"']*theName[^"']*["'][^>]*>([^<]+)</.exec(
        block,
      );

      // Link: <a ... href="/f/SLUG">
      const linkMatch = /href=["']\/f\/([^"']+)["']/.exec(block);

      if (linkMatch) {
        files.push({
          slug: linkMatch[1],
          name: nameMatch ? nameMatch[1].trim() : "Unknown File",
          thumb: thumbMatch ? thumbMatch[1] : "",
        });
      }
    }

    console.log(`[Bunkr] Found ${files.length} files in album.`);

    if (files.length === 0) {
      throw new Error("No files found in Bunkr Album");
    }

    // 2. Fetch the FIRST file to get a playable link
    // We treat the "Video" endpoint as playing the first file of the album.
    // The user can see others in 'sources'.

    // Helper to determine file type
    const getType = (name) => {
      const ext = name.split(".").pop().toLowerCase();
      if (["mp4", "mkv", "webm", "avi", "mov"].includes(ext)) return "video";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
      if (["zip", "rar", "7z", "tar"].includes(ext)) return "archive";
      return "file";
    };

    // 2. Determine Default File (Prioritize Video)
    let defaultFileIndex = 0;
    const firstVideoIndex = files.findIndex((f) => getType(f.name) === "video");
    if (firstVideoIndex !== -1) {
      defaultFileIndex = firstVideoIndex;
      console.log(
        `[Bunkr] Defaulting to first video (index ${defaultFileIndex}): ${files[defaultFileIndex].name}`,
      );
    } else {
      console.log(
        `[Bunkr] No video found, defaulting to first file: ${files[0].name}`,
      );
    }

    // Fetch the download link for the DEFAULT file
    const targetFile = files[defaultFileIndex];
    let downloadUrl = "";

    if (targetFile) {
      const fileUrl = `https://bunkr.cr/f/${targetFile.slug}`;
      console.log(`[Bunkr] Fetching File: ${fileUrl}`);
      const fileResp = await fetch(fileUrl, { headers: getNekoHeaders() });
      const fileHtml = await fileResp.text();
      const downloadMatch = /class="btn btn-main[^"]*" href="([^"]+)"/.exec(
        fileHtml,
      );
      downloadUrl = downloadMatch ? downloadMatch[1] : "";
    }

    // 3. Construct Sources List with Type info
    // 3. Construct Sources List with Type info
    const sources = files.map((f, index) => {
      const type = getType(f.name);

      let url = `https://bunkr.cr/f/${f.slug}`;
      if (type === "image" && f.thumb) {
        // Get high-res URL by removing '/thumbs/'
        url = f.thumb.replace("/thumbs/", "/");

        // Fix for WebP: Thumbnails are .png, but original might be .webp
        if (f.name.toLowerCase().endsWith(".webp")) {
          url = url.replace(/\.png$/, ".webp");
        }
      }

      return {
        url: url,
        name: `File ${index + 1}: ${f.name}`,
        type: type,
        isDefault: index === defaultFileIndex,
      };
    });

    // Attempt to make the first one a direct stream using the download link
    let iframeUrl = downloadUrl;

    const result = {
      id: slug,
      slug: slug,
      name: title,
      description: "Scraped from Bunkr",
      views: 0,
      poster_url: "",
      cover_url: "",
      tags: ["Bunkr", "Bunkr Albums"],
      iframe_url: iframeUrl || "",
      sources: sources,
    };

    if (!iframeUrl) {
      console.warn("[Bunkr] No iframe found.");
    }

    res.json(result);
  } catch (err) {
    console.error("Bunkr Video Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generic Proxy for Streams (m3u8/ts) & Images/Videos
app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const decodedUrl = decodeURIComponent(url);
    // Default headers
    const headers = {
      "User-Agent": NEKOPOI_UA,
    };

    // Forward Range header if present (Critical for video seeking/buffering)
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const response = await fetch(decodedUrl, { headers });

    if (!response.ok)
      console.warn(`Proxy fetch warning: ${response.status} for ${decodedUrl}`);

    // Forward important headers
    const contentType = response.headers.get("content-type");
    const contentRange = response.headers.get("content-range");
    const contentLength = response.headers.get("content-length");
    const acceptRanges = response.headers.get("accept-ranges");

    res.setHeader("Content-Type", contentType || "application/octet-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

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
        return `${host}/api/proxy?url=${encodeURIComponent(match)}`;
      });

      res.send(rewritten);
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
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
  });
}

export default app;
