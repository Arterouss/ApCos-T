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
        `API responded with ${response.status}: ${response.statusText}`
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
      }
    );

    if (!response.ok) {
      throw new Error(
        `API responded with ${response.status}: ${response.statusText}`
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

// --- NEKOPOI SCRAPER Integration ---
const NEKOPOI_BASE_URL = "https://nekopoi.care";
const NEKOPOI_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Helper headers
const getNekoHeaders = () => ({
  "User-Agent": NEKOPOI_UA,
  Referer: NEKOPOI_BASE_URL,
  "Accept-Language": "en-US,en;q=0.9",
});

// Search & Latest Endpoint (Scraper)
app.get("/api/hnime/search", async (req, res) => {
  try {
    let { q, page } = req.query;
    page = parseInt(page) || 1;

    let url;
    if (q) {
      // Format from dump: https://nekopoi.care/search/hentai/page/2/
      url = `${NEKOPOI_BASE_URL}/search/${encodeURIComponent(q)}/page/${page}/`;
    } else {
      // Format: https://nekopoi.care/page/2/
      url =
        page > 1 ? `${NEKOPOI_BASE_URL}/page/${page}/` : `${NEKOPOI_BASE_URL}/`;
    }

    console.log(`[Proxy] Request: q='${q || ""}', page=${page}`);
    console.log(`[Proxy] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: getNekoHeaders(),
    });

    console.log(`[Proxy] Response Status: ${response.status}`);

    if (!response.ok) {
      // If 404 on page > 1, just return empty hits?
      if (response.status === 404) {
        return res.json({
          hits: JSON.stringify([]),
          page,
          nbPages: page,
          hitsPerPage: 0,
        });
      }
      throw new Error(`Nekopoi responded with ${response.status}`);
    }

    const html = await response.text();

    const postRegex =
      /<div class=(?:eropost|top)>[\s\S]*?<img[^>]+src=['"]?([^ >"']+)['"]?[\s\S]*?<h2><a[^>]+href=['"]?([^ >"']+)['"]?[^>]*>(.*?)<\/a>/gi;

    const hits = [];
    let match;
    while ((match = postRegex.exec(html)) !== null) {
      const [_, img, url, rawTitle] = match;

      let title = rawTitle.replace(/<[^>]+>/g, "").trim();
      title = title.replace("&#8211;", "-");

      let slug = url.replace(NEKOPOI_BASE_URL, "");
      if (slug.startsWith("/")) slug = slug.substring(1);
      if (slug.endsWith("/")) slug = slug.slice(0, -1);

      let thumb = img;
      if (thumb.startsWith("//")) thumb = "https:" + thumb;

      hits.push({
        id: slug,
        slug: slug,
        name: title,
        cover_url: thumb,
        poster_url: thumb,
        views: 0,
        tags: ["Nekopoi"],
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
app.get("/api/hnime/video/:slug(*)", async (req, res) => {
  const { slug } = req.params;

  try {
    let targetUrl = `${NEKOPOI_BASE_URL}/${slug}`;
    console.log(`[Nekopoi] Scraping Video: ${targetUrl}`);

    let response = await fetch(targetUrl, { headers: getNekoHeaders() });

    // Fallback: Try trailing slash if 404
    if (response.status === 404 && !slug.endsWith("/")) {
      console.warn(`[Nekopoi] 404 detected. Retrying with trailing slash...`);
      targetUrl = `${NEKOPOI_BASE_URL}/${slug}/`;
      response = await fetch(targetUrl, { headers: getNekoHeaders() });
    }

    if (!response.ok) throw new Error(`Video Fetch Failed: ${response.status}`);

    const html = await response.text();

    // 1. Extract Title
    const titleMatch = /<title>([^<]+)<\/title>/i.exec(html);
    const title = titleMatch
      ? titleMatch[1].replace("– NekoPoi", "").replace("Nekopoi", "").trim()
      : slug;

    // 2. Extract Iframe / Stream
    let iframeUrl = "";
    const sources = [];
    const iframeRegex = /<iframe[^>]+src=['"]?([^ >"']+)['"]?/gi;
    let match;
    let streamCount = 0;

    while ((match = iframeRegex.exec(html)) !== null) {
      const src = match[1];
      if (
        src.includes("youtube") ||
        src.includes("chat") ||
        src.includes("google")
      )
        continue;

      streamCount++;
      sources.push({
        url: src,
        name:
          `Server ${streamCount}` + (src.includes("ouo") ? " (Download)" : ""),
      });

      if (!iframeUrl) iframeUrl = src;
    }

    const result = {
      id: slug,
      slug: slug,
      name: title,
      description: "Scraped from Nekopoi",
      views: 0,
      poster_url: "",
      cover_url: "",
      tags: ["Nekopoi", "Anime", "Hentai"],
      iframe_url: iframeUrl || "",
      sources: sources,
    };

    if (!iframeUrl) {
      console.warn("[Nekopoi] No iframe found.");
    }

    res.json(result);
  } catch (err) {
    console.error("Nekopoi Video Error:", err.message);
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

// Vercel Serverless Export
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
  });
}

export default app;
