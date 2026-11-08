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
  const cleanSearch = (search || "").trim();
  if (cleanSearch) {
    const pageParam = page > 1 ? `?page=${page}` : "";
    url = `${BASE_URL}/search/${encodeURIComponent(cleanSearch)}/${pageParam}`;
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
  const systemSlugs = new Set([
    "search", "trending", "popular", "top-likes", "new", "random", "videos",
    "dmca", "contact", "privacy-policy", "terms", "search_by_photo", "contact_us", "login", "register"
  ]);

  // Extract from search result container
  if (cleanSearch) {
    $("#content a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/fapello\.(?:com|su)\/([a-zA-Z0-9_-]+)\/?$/i);
      if (!match) return;
      const slug = match[1].toLowerCase();
      if (systemSlugs.has(slug) || seen.has(slug)) return;
      seen.add(slug);

      const $parent = $(el).closest(".shadow, .rounded-md, div[class*='relative'], div");
      const cover = $(el).find("img").attr("src") || $parent.find("img").attr("src") || "";
      let name = $(el).text().replace(/\s+/g, " ").trim();
      if (!name || name === slug) {
        name = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }

      results.push({
        id: slug,
        slug,
        name,
        cover_url: cover,
        followers: "",
        original_url: `https://fapello.com/${slug}/`,
      });
    });
  }

  // Fapello model cards: div.flex.flex-1.items-center with inner <a> and <img>
  $("div.flex.flex-1.items-center").each((i, el) => {
    const $a = $(el).find("a").first();
    const $img = $(el).find("img").first();
    if (!$a.length || !$img.length) return;

    const href = $a.attr("href") || "";
    const match = href.match(/fapello\.(?:com|su)\/([a-zA-Z0-9_-]+)\/?$/i);
    if (!match) return;
    const slug = match[1].toLowerCase();
    if (systemSlugs.has(slug) || seen.has(slug)) return;
    seen.add(slug);

    let name = $(el).text().replace(/\s+/g, " ").trim();
    if (!name || name === slug) {
      name = slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const cover = $img.attr("src") || $img.attr("data-src") || "";
    const followers = $(el).find("[class*='follow']").text().trim() || "";

    results.push({
      id: slug,
      slug,
      name,
      cover_url: cover,
      followers,
      original_url: `https://fapello.com/${slug}/`,
    });
  });

  // Prioritize exact / closest matches to the top
  if (cleanSearch) {
    const q = cleanSearch.toLowerCase().replace(/[-_\s]/g, "");
    results.sort((a, b) => {
      const aSlug = a.slug.replace(/[-_\s]/g, "");
      const bSlug = b.slug.replace(/[-_\s]/g, "");
      if (aSlug === q && bSlug !== q) return -1;
      if (bSlug === q && aSlug !== q) return 1;
      if (aSlug.startsWith(q) && !bSlug.startsWith(q)) return -1;
      if (bSlug.startsWith(q) && !aSlug.startsWith(q)) return 1;
      return 0;
    });
  }

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
