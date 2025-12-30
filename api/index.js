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

// --- HAnime Integration ---
const HANIME_BASE = "https://hanime.tv/api/v8";
const HANIME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const HANIME_HEADERS = {
  "User-Agent": HANIME_UA,
  Referer: "https://hanime.tv/",
  Origin: "https://hanime.tv",
  "X-Directive": "api",
  "Sec-Ch-Ua":
    '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  "X-Forwarded-For": Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 255)
  ).join("."), // Random IP Spoofing
};

// Trending / Landing
app.get("/api/hnime/trending", async (req, res) => {
  try {
    console.log("Fetching HAnime Trending...");
    const response = await fetch(`${HANIME_BASE}/landing`, {
      headers: HANIME_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Hanime Landing failed: ${response.status}`);
    }

    const data = await response.json();

    let videos = [];
    if (data.hentai_videos) {
      videos = data.hentai_videos;
    } else if (data.sections) {
      const trendingSection = data.sections.find(
        (s) => s.title === "Trending" || s.title === "Popular"
      );
      if (trendingSection && trendingSection.hentai_videos) {
        videos = trendingSection.hentai_videos;
      } else {
        videos = data.sections[0]?.hentai_videos || [];
      }
    }

    const results = videos.map((v) => ({
      id: v.slug,
      slug: v.slug,
      name: v.name,
      cover_url: v.cover_url,
      poster_url: v.poster_url,
      views: v.views,
      rating: v.rating,
      released: v.released_at_unix
        ? new Date(v.released_at_unix * 1000).toISOString().split("T")[0]
        : "Unknown",
    }));

    res.json(results);
  } catch (err) {
    console.error("HAnime Trending Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Video Details
app.get("/api/hnime/video/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    console.log(`Fetching HAnime Video: ${slug}`);
    const response = await fetch(`${HANIME_BASE}/video?id=${slug}`, {
      headers: HANIME_HEADERS,
    });

    if (!response.ok) {
      throw new Error(`Hanime Video failed: ${response.status}`);
    }

    const data = await response.json();
    const video = data.hentai_video;
    const manifest = data.videos_manifest;

    if (!video) throw new Error("Video not found in response");

    let sources = [];
    if (manifest && manifest.servers) {
      manifest.servers.forEach((server) => {
        server.streams.forEach((stream) => {
          if (stream.url) {
            sources.push({
              label: `${server.name} - ${stream.height}p`,
              url: stream.url,
              type: "hls",
            });
          }
        });
      });
    }

    const result = {
      id: video.slug,
      slug: video.slug,
      name: video.name,
      description: video.description,
      views: video.views,
      interests: video.interests,
      poster_url: video.poster_url,
      cover_url: video.cover_url,
      tags: video.tags ? video.tags.map((t) => t.text) : [],
      created_at: video.created_at,
      released_at: video.released_at,
      sources: sources,
    };

    res.json(result);
  } catch (err) {
    console.error("HAnime Video Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Search
app.get("/api/hnime/search/:query", async (req, res) => {
  const { query } = req.params;
  const { page = 0 } = req.query;

  try {
    console.log(`Searching HAnime: ${query} (Page ${page})`);
    const response = await fetch("https://search.htv-services.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": HANIME_UA,
        Origin: "https://hanime.tv",
        Referer: "https://hanime.tv/",
      },
      body: JSON.stringify({
        search_text: query,
        tags: [],
        tags_mode: "AND",
        brands: [],
        blacklist: [],
        order_by: "created_at_unix",
        ordering: "desc",
        page: parseInt(page),
      }),
    });

    if (!response.ok) {
      throw new Error(`Hanime Search failed: ${response.status}`);
    }

    const data = await response.json();
    const hits = data.hits || [];

    const results = JSON.parse(JSON.stringify(hits)).map((v) => ({
      id: v.slug || v.id,
      slug: v.slug || v.id,
      name: v.name,
      cover_url: v.cover_url,
      poster_url: v.poster_url,
      views: v.views,
      rating: v.rating,
      released: v.released_at_unix
        ? new Date(v.released_at_unix * 1000).toISOString().split("T")[0]
        : "Unknown",
    }));

    res.json(results);
  } catch (err) {
    console.error("HAnime Search Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Browse (Latest / Empty Search)
app.get("/api/hnime/browse", async (req, res) => {
  const { page = 0 } = req.query;

  try {
    // console.log(`Browsing HAnime (Page ${page})`);
    const response = await fetch("https://search.htv-services.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": HANIME_UA,
        Origin: "https://hanime.tv",
        Referer: "https://hanime.tv/",
      },
      body: JSON.stringify({
        search_text: "",
        tags: [],
        tags_mode: "AND",
        brands: [],
        blacklist: [],
        order_by: "created_at_unix",
        ordering: "desc",
        page: parseInt(page),
      }),
    });

    if (!response.ok) {
      throw new Error(`Hanime Browse failed: ${response.status}`);
    }

    const data = await response.json();
    const hits = data.hits || [];

    const results = JSON.parse(JSON.stringify(hits)).map((v) => ({
      id: v.slug || v.id,
      slug: v.slug || v.id,
      name: v.name,
      cover_url: v.cover_url,
      poster_url: v.poster_url,
      views: v.views,
      rating: v.rating,
      released: v.released_at_unix
        ? new Date(v.released_at_unix * 1000).toISOString().split("T")[0]
        : "Unknown",
    }));

    res.json(results);
  } catch (err) {
    console.error("HAnime Browse Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Generic Proxy for Streams (m3u8/ts)
app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const decodedUrl = decodeURIComponent(url);
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

    // If it's a playlist (m3u8), we need to rewrite internal URLs to also use the proxy
    if (
      contentType &&
      (contentType.includes("mpegurl") ||
        contentType.includes("m3u8") ||
        decodedUrl.endsWith(".m3u8"))
    ) {
      const text = await response.text();
      const host = `https://${req.headers.host}`; // Use https for Vercel

      // Rewrite absolute URLs to go through proxy
      const rewritten = text.replace(/(https?:\/\/[^\s"']+)/g, (match) => {
        return `${host}/api/proxy?url=${encodeURIComponent(match)}`;
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
