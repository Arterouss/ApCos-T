import * as cheerio from "cheerio";
import axios from "axios";
import { filterBlockedItems, filterBlockedTags } from "./contentFilter.js";

const BASE_URL = "https://porn3dx.com";
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

/**
 * Memeriksa status kesehatan server target Porn3dx
 */
async function checkPorn3dxServer() {
  try {
    const res = await axios.get(BASE_URL, {
      timeout: 8000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      }
    });

    if (res.status === 503 || (typeof res.data === "string" && res.data.includes("down for a bit of maintenance"))) {
      const err = new Error("MAINTENANCE: Server pusat Porn3dx (porn3dx.com) saat ini sedang dalam pemeliharaan (Maintenance Mode) oleh pengelola aslinya. Konten akan otomatis muncul kembali setelah pemeliharaan selesai.");
      err.isMaintenance = true;
      throw err;
    }

    return res;
  } catch (err) {
    if (err.isMaintenance) throw err;
    return null;
  }
}

/**
 * Fetch HTML dari Porn3dx dengan multi-strategy:
 * 1. Direct request (cepat & hemat kuota proxy jika server tidak memblokir)
 * 2. ZenRows Web Scraper Proxy jika diperlukan bypass cloudflare
 */
const fetchPorn3dxHtml = async (targetUrl) => {
  // 1. Cek apakah server target sedang maintenance
  const checkRes = await checkPorn3dxServer();
  if (checkRes && checkRes.status === 200 && typeof checkRes.data === "string") {
    // Jika respon langsung mengandung post list, gunakan langsung tanpa ZenRows
    if (checkRes.data.includes("wire:key") || checkRes.data.includes("/post/")) {
      console.log(`[Porn3dx Direct] Sukses mengambil data langsung dari ${targetUrl}`);
      return checkRes.data;
    }
  }

  // 2. Gunakan ZenRows Proxy
  const url = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&js_render=true`;
  console.log(`[Porn3dx ZenRows] Fetching ${targetUrl}`);
  try {
    const r = await axios.get(url, { timeout: 45000 });
    if (typeof r.data === "string" && r.data.includes("down for a bit of maintenance")) {
      const err = new Error("MAINTENANCE: Server pusat Porn3dx saat ini sedang dalam pemeliharaan (Maintenance Mode).");
      err.isMaintenance = true;
      throw err;
    }
    return r.data;
  } catch (e) {
    if (e.isMaintenance) throw e;
    console.error(`[Porn3dx ZenRows] Failed: ${e.message}`);
    throw new Error("Gagal mengambil data dari server Porn3dx. Server pusat sedang mengalami kendala atau pemeliharaan.");
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

  let html;
  try {
    html = await fetchPorn3dxHtml(url);
  } catch (fetchErr) {
    // Jika terjadi kendala / maintenance, periksa apakah ada data cadangan di MongoDB
    try {
      const { connectDB } = await import("./telegramDb.js");
      const db = await connectDB();
      const cached = await db.collection("cached_porn3dx").find({}).sort({ savedAt: -1 }).limit(30).toArray();
      if (cached && cached.length > 0) {
        console.log(`[Porn3dx Cache] Menyajikan ${cached.length} item dari cadangan database selama server maintenance.`);
        return filterBlockedItems(cached);
      }
    } catch (cacheErr) {
      console.warn("[Porn3dx Cache] Gagal membaca cache:", cacheErr.message);
    }
    throw fetchErr;
  }

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

  const filtered = filterBlockedItems(results);

  // Auto-cache hasil sukses ke database agar memiliki cadangan jika server maintenance lagi
  if (filtered.length > 0 && !search && !tag && page === 1) {
    (async () => {
      try {
        const { connectDB } = await import("./telegramDb.js");
        const db = await connectDB();
        const col = db.collection("cached_porn3dx");
        for (const item of filtered.slice(0, 30)) {
          await col.updateOne(
            { slug: item.slug },
            { $set: { ...item, savedAt: new Date() } },
            { upsert: true }
          );
        }
      } catch (cErr) {
        console.warn("[Porn3dx Cache] Gagal menyimpan cache:", cErr.message);
      }
    })();
  }

  return filtered;
};

export const scrapePorn3dxDetail = async (slug) => {
  const url = `${BASE_URL}/post/${slug}`;
  let html;
  try {
    html = await fetchPorn3dxHtml(url);
  } catch (err) {
    // Jika server sedang maintenance, cek cache detail
    try {
      const { connectDB } = await import("./telegramDb.js");
      const db = await connectDB();
      const cached = await db.collection("cached_porn3dx").findOne({ slug });
      if (cached) {
        return {
          title: cached.title,
          cover_url: cached.cover_url,
          video_url: "",
          video_type: cached.type || "video",
          images: cached.cover_url ? [cached.cover_url] : [],
          tags: [],
          description: "Detail video cadangan. Server pusat Porn3dx saat ini sedang dalam pemeliharaan.",
          original_url: cached.original_url || `${BASE_URL}/post/${slug}`,
          slug,
          isMaintenance: true,
        };
      }
    } catch (cErr) {
      console.warn("[Porn3dx Cache] Lookup error:", cErr.message);
    }
    throw err;
  }

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
    tags: filterBlockedTags(tags),
    description,
    original_url: url,
    slug,
  };
};
