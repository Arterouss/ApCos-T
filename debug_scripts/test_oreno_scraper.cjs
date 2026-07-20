const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8", "1.0.0.1", "8.8.4.4"]);
const sslAgent = new https.Agent({ rejectUnauthorized: false });

async function scrapeOreno3dDetail(id) {
  const url = `https://oreno3d.com/movies/${id}`;
  const res = await axios.get(url, {
    httpsAgent: sslAgent,
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000
  });
  const $ = cheerio.load(res.data);

  const title = $("h1").text().trim() || $("title").text().split("｜")[0].trim() || "Untitled";
  
  // Extract tags
  const tags = [];
  $(".video-tag-btn .tag-text, .tag-btn .tag-text").each((i, el) => {
    const t = $(el).text().trim();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // Extract author / comment
  const authorComment = $(".video-information-comment").text().trim();
  const author = $(".video-h2-authors").text().replace("作者コメント：", "").trim() || "Iwara Creator";

  // Extract original iwara ID
  let iwaraVideoId = id; // fallback to oreno id
  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";
    if (href.includes("iwara.tv/video/")) {
      const parts = href.split("iwara.tv/video/")[1]?.split("/");
      if (parts && parts[0]) {
        iwaraVideoId = parts[0];
      }
    }
  });

  let thumb = $(".video-player").attr("poster") || $('meta[property="og:image"]').attr("content") || "";
  const proxiedThumb = thumb ? `/api/proxy/image?url=${encodeURIComponent(thumb)}&referer=${encodeURIComponent("https://oreno3d.com/")}` : null;

  return {
    id: id,
    slug: id,
    iwaraId: iwaraVideoId,
    iwaraSlug: iwaraVideoId,
    title: title,
    thumbnail: proxiedThumb,
    views: 0,
    likes: 0,
    author: author,
    authorComment: authorComment,
    date: "",
    tags: tags,
    rating: "all",
    externalVideoUrl: url,
    originalUrl: `https://www.iwara.tv/video/${iwaraVideoId}`,
    iwaraVideoId: iwaraVideoId
  };
}

scrapeOreno3dDetail("340810").then(console.log).catch(e => console.error(e.message));
