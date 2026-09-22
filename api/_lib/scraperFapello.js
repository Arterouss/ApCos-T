import * as cheerio from "cheerio";
import axios from "axios";

const BASE_URL = "https://fapello.com";
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

const fetchZenRows = async (targetUrl) => {
  const url = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&js_render=true`;
  console.log(`[Fapello ZenRows] Fetching ${targetUrl}`);
  try {
    const r = await axios.get(url, { timeout: 90000 });
    return r.data;
  } catch (e) {
    console.error(`[Fapello ZenRows] Failed: ${e.message}`);
    throw new Error("Gagal mengambil data dari Fapello.");
  }
};

export const scrapeFapelloList = async ({ page = 1, search = "", sort = "trending" }) => {
  let url;
  if (search) {
    url = `${BASE_URL}/search_v2/?q=${encodeURIComponent(search)}&page=${page}`;
  } else if (sort === "new") {
    url = `${BASE_URL}/new/?page=${page}`;
  } else if (sort === "top") {
    url = `${BASE_URL}/top-likes/?page=${page}`;
  } else {
    url = `${BASE_URL}/trending/?page=${page}`;
  }

  const html = await fetchZenRows(url);
  const $ = cheerio.load(html);

  const results = [];
  const seen = new Set();

  // Fapello model cards: div.flex.flex-1.items-center with inner <a> and <img>
  $("div.flex.flex-1.items-center").each((i, el) => {
    const $a = $(el).find("a").first();
    const $img = $(el).find("img").first();
    if (!$a.length || !$img.length) return;

    const href = $a.attr("href") || "";
    if (seen.has(href) || !href.match(/fapello\.(com|su)\/[a-z0-9_-]+\/?$/i)) return;
    seen.add(href);

    const slug = href.replace(/https?:\/\/fapello\.(com|su)\//, "").replace(/\/$/, "");
    const name = $(el).text().replace(/\s+/g, " ").trim() || slug;
    const cover = $img.attr("src") || $img.attr("data-src") || "";

    // Follower count if available
    const followers = $(el).find("[class*='follow']").text().trim() || "";

    results.push({
      id: slug,
      slug,
      name,
      cover_url: cover,
      followers,
      original_url: href,
    });
  });

  return results;
};

export const scrapeFapelloModel = async (slug) => {
  const url = `${BASE_URL}/${slug}/`;
  const html = await fetchZenRows(url);
  const $ = cheerio.load(html);

  const name = $("h2, h1").first().text().trim() || slug;

  // Model avatar
  let avatar = "";
  $("img").each((i, el) => {
    const src = $(el).attr("src") || "";
    if (src.includes("/1000/") && !avatar) avatar = src;
  });

  // Follower count
  const followers = $("[class*='follower']").first().text().trim() || "";

  // All posts (images and videos)
  const posts = [];
  const seen = new Set();

  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";
    const match = href.match(new RegExp(`/${slug}/(\\d+)/?`));
    if (!match) return;
    const postId = match[1];
    if (seen.has(postId)) return;
    seen.add(postId);

    const $img = $(el).find("img").first();
    const $video = $(el).find("video").first();
    let cover = $img.attr("src") || $img.attr("data-src") || "";
    const isVideo = $video.length > 0;

    posts.push({
      id: postId,
      href,
      cover_url: cover,
      full_url: cover ? cover.replace("_300px", "") : "",
      is_video: isVideo,
    });
  });

  return {
    slug,
    name,
    avatar,
    followers,
    posts,
    original_url: url,
  };
};
