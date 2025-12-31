import express from "express";
import cors from "cors";
import fetch from "node-fetch"; // Ensure node-fetch is used (even if global in newer node)

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

// --- HAnime Integration (Manual Fetch) ---
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
      // Find trending section
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

// Generic Proxy for Streams (m3u8/ts) & Images/Videos
app.get("/api/proxy", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("URL required");

  try {
    const decodedUrl = decodeURIComponent(url);
    const isHanime =
      decodedUrl.includes("hanime.tv") || decodedUrl.includes("googleapis");

    // Default headers
    const headers = {
      "User-Agent": HANIME_UA,
    };

    // Forward Range header if present (Critical for video seeking/buffering)
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    // Only add specific Referer/Origin if it's Hanime
    if (isHanime) {
      headers["Referer"] = "https://hanime.tv/";
      headers["Origin"] = "https://hanime.tv";
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
      const host = `http://${req.headers.host}`;
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
    // Removing authentication for tags as it commonly causes issues on this endpoint or is unnecessary
    const targetUrl = `https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&limit=${
      limit || 30
    }&json=1&order=count`;
    console.log(`Fetching Rule34 Tags: ${targetUrl}`);

    // Try without keys first (often public). If fails, we can add them back.
    const response = await fetch(targetUrl);

    if (!response.ok) {
      console.error(`Status: ${response.status}`);
      const text = await response.text();
      console.error(`Body: ${text}`);
      throw new Error(`R34 Tags Error: ${response.status}`);
    }

    // Check if empty content
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

app.get("/api/r34/posts", async (req, res) => {
  try {
    const { tags, limit, pid } = req.query; // pid = page id

    // Enforce Blacklist (No LGBT/Gay content as requested)
    const blacklist = " -gay -yaoi -male_on_male -bara";
    const statusTags = ""; // " sort:score" optional for quality

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

    // R34 returns empty string or different format when no results
    if (!Array.isArray(data)) {
      return res.json([]);
    }

    res.json(data);
  } catch (err) {
    console.error("Rule34 Proxy Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
