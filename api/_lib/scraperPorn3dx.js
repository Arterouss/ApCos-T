import * as cheerio from "cheerio";
import axios from "axios";

const BASE_URL = "https://porn3dx.com";
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

const fetchZenRows = async (targetUrl) => {
  const url = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&js_render=true`;
  console.log(`[Porn3dx ZenRows] Fetching ${targetUrl}`);
  try {
    const r = await axios.get(url, { timeout: 90000 });
    return r.data;
  } catch (e) {
    console.error(`[Porn3dx ZenRows] Failed: ${e.message}`);
    throw new Error("Gagal mengambil data dari Porn3dx.");
  }
};

export const scrapePorn3dxList = async ({ page = 1, search = "", tag = "" }) => {
  let url;
  if (search) {
    url = `${BASE_URL}/?search=${encodeURIComponent(search)}&page=${page}`;
  } else if (tag) {
    url = `${BASE_URL}/?tag=${encodeURIComponent(tag)}&page=${page}`;
  } else {
    url = page > 1 ? `${BASE_URL}/?page=${page}` : BASE_URL;
  }

  const html = await fetchZenRows(url);
  const $ = cheerio.load(html);

  const results = [];
  const seen = new Set();

  // Porn3dx uses: <div wire:key="grid-XXXXX"> <a href="https://porn3dx.com/post/XXXXX/slug">
  $('[wire\\:key^="grid-"]').each((i, el) => {
    const $a = $(el).find("a[href*='/post/']").first();
    if (!$a.length) return;

    const href = $a.attr("href") || "";
    if (seen.has(href)) return;
    seen.add(href);

    const postId = href.match(/\/post\/(\d+)/)?.[1] || "";
    const slug = href.split("/post/")[1]?.replace(/\/$/, "") || postId;
    const title = $a.attr("alt") || $a.find("img").attr("alt") || "Unknown";

    // Thumbnail is in data-img attribute
    const $img = $a.find("img").first();
    const cover = $img.attr("data-img") || $img.attr("src") || "";

    // Check if it has a video (bunny attr) or image
    const isVideo = $a.attr("bunny") !== undefined;

    // Duration badge
    const duration = $a.find("span").filter((_, s) => $(s).text().match(/\d+:\d+/)).first().text().trim() || "";

    // Views
    const views = $a.find("[class*='chart-bar']").parent().find("span").last().text().trim() || "";

    results.push({
      id: postId,
      slug,
      title: title.replace(/\s+/g, " ").trim(),
      cover_url: cover,
      type: isVideo ? "video" : "image",
      duration,
      views,
      original_url: href,
    });
  });

  return results;
};

export const scrapePorn3dxDetail = async (slug) => {
  const url = `${BASE_URL}/post/${slug}`;
  const html = await fetchZenRows(url);
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || $("title").text().trim() || "Unknown";

  // Get cover image
  let cover_url = "";
  $("img").each((i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-img") || "";
    if (src && (src.includes("3dxmedia") || src.includes("b-cdn.net") || src.includes("thumbnail")) && !cover_url) {
      cover_url = src;
    }
  });

  // Get video embed (Bunny CDN iframe)
  let video_url = "";
  let video_type = "image"; // "image" or "video" or "bunny"
  const $iframe = $("iframe[src*='iframe.mediadelivery']").first();
  if ($iframe.length) {
    video_url = $iframe.attr("src") || "";
    video_type = "bunny";
  }

  // Check for direct video
  const $video = $("video source").first();
  if ($video.length) {
    video_url = $video.attr("src") || "";
    video_type = "video";
  }

  // Get all gallery images (for image posts)
  const images = [];
  $("img[data-img], img[src*='3dxmedia'], img[src*='b-cdn.net']").each((i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-img") || "";
    if (src && !src.includes("logo") && !src.includes("svg") && !src.includes("avatar")) {
      images.push(src);
    }
  });

  // Tags
  const tags = [];
  $("a[href*='/tag/'], a[href*='/?tag=']").each((i, el) => {
    const t = $(el).text().trim();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // Synopsis/description
  const description = $("meta[name='description']").attr("content") || "";

  return {
    title,
    cover_url,
    video_url,
    video_type,
    images: [...new Set(images)],
    tags,
    description,
    original_url: url,
    slug,
  };
};
