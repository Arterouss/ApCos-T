const fs = require('fs');

const lines = fs.readFileSync('api/index.js', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('// NEKOPOI API')) - 1;
const end = lines.findIndex((l, i) => i > start && l.includes('// CAVPORN SCRAPER (cav103.com)')) - 1;

const newContent = `// ==========================================
// ORENO3D API
// ==========================================

const parseOreno3dPosts = ($) => {
  const posts = [];
  $("article a.box").each((i, el) => {
    const url = $(el).attr("href");
    const title = $(el).find("h2.box-h2").text().trim();
    let thumb = $(el).find("img.main-thumbnail").attr("src");
    
    if (thumb && thumb.startsWith("/")) {
      thumb = \`https://oreno3d.com\${thumb}\`;
    }

    const slug = url ? url.split("/").filter(Boolean).pop() : null;

    if (title && url) {
      posts.push({
        id: slug,
        slug,
        title,
        thumbnail: thumb ? \`/api/proxy/image?url=\${encodeURIComponent(thumb)}\` : null,
        url,
      });
    }
  });
  return posts;
};

const orenoAgent = new https.Agent({ rejectUnauthorized: false });
const fetchOreno = async (url) => {
  const res = await axios.get(url, {
    httpsAgent: orenoAgent,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  return res.data;
};

app.get("/api/oreno3d/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

  try {
    const url = \`https://oreno3d.com/search?keyword=\${encodeURIComponent(q)}&page=\${page}\`;
    console.log(\`[Oreno3D] Searching: \${url}\`);

    const html = await fetchOreno(url);
    const $ = cheerio.load(html);
    const posts = parseOreno3dPosts($);

    console.log(\`[Oreno3D] Search found \${posts.length} items\`);
    res.json(posts);
  } catch (error) {
    console.error("Oreno3D Search Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/oreno3d/latest", async (req, res) => {
  const page = req.query.page || 1;
  const url = \`https://oreno3d.com/?page=\${page}\`;

  try {
    const html = await fetchOreno(url);
    const $ = cheerio.load(html);
    const posts = parseOreno3dPosts($);
    res.json(posts);
  } catch (error) {
    console.error("Oreno3D Latest Error:", error.message);
    res.status(500).json({ error: "Failed to fetch Oreno3D data" });
  }
});

app.get("/api/oreno3d/detail", async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "ID required" });

  const url = \`https://oreno3d.com/movies/\${id}\`;

  try {
    const html = await fetchOreno(url);
    const $ = cheerio.load(html);

    const title = $("h1.video-h1").text().trim();
    
    let videoIframes = [];
    let rawVideoUrls = [];
    
    const iwaraLink = $("a.pop_separate").attr("href");
    if (iwaraLink && iwaraLink.includes("iwara.tv/video/")) {
      const parts = iwaraLink.split("/video/")[1].split("/");
      const iwaraId = parts[0];
      videoIframes.push(\`https://www.iwara.tv/embed/\${iwaraId}\`);
    }

    res.json({
      title,
      images: [],
      videoIframes,
      rawVideoUrls, 
      downloadLinks: [],
      originalUrl: url,
    });
  } catch (error) {
    console.error("Oreno3D Detail Error:", error.message);
    res.status(500).json({ error: "Failed to fetch detail" });
  }
});
`;

lines.splice(start, end - start, newContent);
fs.writeFileSync('api/index.js', lines.join('\n'));
console.log('Replaced successfully! Start:', start, 'End:', end);
