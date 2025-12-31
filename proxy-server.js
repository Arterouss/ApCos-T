import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // Ensure node-fetch is used (even if global in newer node)
import { Buffer } from "node:buffer";

const app = express();
const PORT = 3001;

app.use(cors());

// Proxy endpoint for creators
app.get("/api/creators", async (req, res) => {
  try {
    console.log("Fetching creators from Kemono API...");

    // Critical: Using 'Accept: text/css' as suggested by the API error message
    // to bypass DDOS-guard protection for JSON/SPA requests.
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

// --- HAnime Integration (Puppeteer for Hanime1.me) ---
import puppeteer from "puppeteer";

const HANIME1_BASE = "https://hanime1.me";

// Simple in-memory cache to respect rate limits & speed up
const cache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour

app.get("/api/hnime/trending", async (req, res) => {
  const cacheKey = "trending";
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("Serving trending from cache");
    return res.json(cached.data);
  }

  let browser;
  try {
    console.log("Launching Puppeteer for Trending...");
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    console.log("Navigating to hanime1.me...");
    await page.goto(HANIME1_BASE, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Scrape trending/latest videos
    const videos = await page.evaluate(() => {
      // Logic specific to hanime1.me DOM structure
      // Adjust selectors based on actual site structure.
      // Assuming a grid of videos.
      const items = Array.from(
        document.querySelectorAll(".content-padding-new .hvr-grow")
      );
      return items
        .map((item) => {
          const link = item.parentElement.getAttribute("href") || "";
          const img = item.querySelector("img");
          const titleDiv = item.querySelector(".card-mobile-title");

          // Extract basic info
          // href is usually /watch?v=12345
          const slug = link.split("v=")[1];

          return {
            id: slug,
            slug: slug, // passing ID as slug for compatibility
            name: titleDiv ? titleDiv.textContent.trim() : "Unknown",
            cover_url: img ? img.src : "",
            poster_url: img ? img.src : "",
            views: 0, // Not easily Scrapeable on grid without hover
            rating: 0,
          };
        })
        .filter((v) => v.id); // Filter empty
    });

    console.log(`Scraped ${videos.length} videos.`);

    cache.set(cacheKey, { timestamp: Date.now(), data: videos });
    res.json(videos);
  } catch (err) {
    console.error("Puppeteer Trending Error:", err.message);
    res.status(500).json({ error: "Failed to fetch trending: " + err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get("/api/hnime/video/:slug", async (req, res) => {
  const { slug } = req.params; // This is actually the 'v' parameter ID
  const cacheKey = `video_${slug}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Serving video ${slug} from cache`);
    return res.json(cached.data);
  }

  let browser;
  try {
    console.log(`Launching Puppeteer for Video ${slug}...`);
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const targetUrl = `${HANIME1_BASE}/watch?v=${slug}`;
    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Extract video details
    const videoData = await page.evaluate(() => {
      const titleEl = document.querySelector("h3.mr-auto"); // Title usually here
      // Video source extraction
      const videoEl = document.querySelector("video#player");
      let src = "";

      if (videoEl) {
        src = videoEl.src;
        // Sometimes src is in a <source> child
        if (!src && videoEl.querySelector("source")) {
          src = videoEl.querySelector("source").src;
        }
      }

      // Description
      // Metadata usually in a text block below
      const tags = Array.from(
        document.querySelectorAll(".btn.btn-danger.btn-xs.mb-1")
      ).map((t) => t.textContent.trim());

      return {
        name: titleEl ? titleEl.textContent.trim() : "Unknown",
        description: "Scraped from Hanime1.me",
        poster_url: videoEl ? videoEl.getAttribute("poster") : "",
        cover_url: videoEl ? videoEl.getAttribute("poster") : "",
        tags: tags,
        views: 0,
        released_at: new Date().toISOString(),
        // Important: Sources
        sources: src
          ? [
              {
                label: "720p/1080p",
                url: src,
                type: src.includes(".m3u8") ? "hls" : "mp4", // Auto detect
              },
            ]
          : [],
      };
    });

    if (!videoData.sources.length) {
      throw new Error(
        "No video source found. Page might be restricted or layout changed."
      );
    }

    const result = {
      id: slug,
      slug: slug,
      ...videoData,
    };

    console.log(`Scraped video: ${result.name}`);
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (err) {
    console.error("Puppeteer Video Error:", err.message);
    res.status(500).json({ error: "Failed to fetch video: " + err.message });
  } finally {
    if (browser) await browser.close();
  }
});

// Generic Proxy for Streams (m3u8/ts)
const HANIME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const decodedUrl = decodeURIComponent(url);
    const parsedUrl = new URL(decodedUrl);

    // SSRF Protection: Block local/private IPs
    const hostname = parsedUrl.hostname;
    const isPrivate =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      (hostname.startsWith("172.") &&
        parseInt(hostname.split(".")[1]) >= 16 &&
        parseInt(hostname.split(".")[1]) <= 31);

    if (isPrivate) {
      return res.status(403).send("Forbidden: Private network access denied");
    }

    // console.log(`Proxying stream: ${decodedUrl}`);

    const response = await fetch(decodedUrl, {
      headers: {
        "User-Agent": HANIME_UA,
        Referer: "https://hanime.tv/",
        Origin: "https://hanime.tv",
      },
    });

    if (!response.ok)
      throw new Error(`Stream fetch failed: ${response.status}`);

    const contentType = response.headers.get("content-type");
    res.setHeader(
      "Content-Type",
      contentType || "application/vnd.apple.mpegurl"
    );
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Use req.protocol + host to construct the base proxy URL
    // Fallback to 'http' locally if req.protocol is not trustworthy (e.g. behind weird proxy)
    const protocol = req.headers["x-forwarded-proto"] || "http";
    const host = req.headers.host;
    const proxyBase = `${protocol}://${host}/api/proxy`;

    // If it's a playlist (m3u8), we need to rewrite URLs to also use the proxy
    if (
      (contentType &&
        (contentType.includes("mpegurl") || contentType.includes("m3u8"))) ||
      decodedUrl.endsWith(".m3u8")
    ) {
      const text = await response.text();

      // Rewrite both absolute and relative URLs
      const rewritten = text.replace(/^(?!#)(?!\s)(.+)$/gm, (match) => {
        // Resolve the match (which could be relative) against the original decodedUrl
        // trim whitespace just in case
        const line = match.trim();
        if (!line) return match;

        try {
          const absoluteUrl = new URL(line, decodedUrl).href;
          return `${proxyBase}?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (err) {
          console.warn(`Failed to resolve URL in m3u8: ${line}`);
          return line;
        }
      });

      res.send(rewritten);
    } else {
      // Binary data (ts segments, etc.)
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    console.error("Stream Proxy Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
