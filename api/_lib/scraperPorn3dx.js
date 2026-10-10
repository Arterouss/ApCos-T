import * as cheerio from "cheerio";
import { filterBlockedItems, filterBlockedTags } from "./contentFilter.js";
import { fetchWithProxy } from "./fetchProxy.js";

const BASE_URL = "https://porn3dx.com";

/**
 * Fetch HTML dari Porn3dx dengan proxy/DoH fallback.
 */
const fetchPorn3dxHtml = async (targetUrl) => {
  const html = await fetchWithProxy(targetUrl, { js: false });
  if (typeof html === "string" && html.includes("down for a bit of maintenance")) {
    const err = new Error("MAINTENANCE: Server pusat Porn3dx (porn3dx.com) sedang dalam pemeliharaan sementara.");
    err.isMaintenance = true;
    throw err;
  }
  return html;
};

export const scrapePorn3dxList = async ({ page = 1, search = "", tag = "" }) => {
  let url;
  if (search) {
    url = `${BASE_URL}/search?q=${encodeURIComponent(search)}&page=${page}`;
  } else if (tag) {
    url = `${BASE_URL}/tag/${encodeURIComponent(tag)}?page=${page}`;
  } else {
    url = page > 1 ? `${BASE_URL}/explore?page=${page}` : `${BASE_URL}/explore`;
  }

  let html;
  try {
    html = await fetchPorn3dxHtml(url);
  } catch (fetchErr) {
    // Jika terjadi kendala koneksi ke server pusat, periksa data cadangan di database
    try {
      const { connectDB } = await import("./telegramDb.js");
      const db = await connectDB();
      const cached = await db.collection("cached_porn3dx").find({}).sort({ savedAt: -1 }).limit(30).toArray();
      if (cached && cached.length > 0) {
        console.log(`[Porn3dx Cache] Menyajikan ${cached.length} item dari cadangan database.`);
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

  // 1. Selector untuk versi Next.js modern (menggunakan grid cards a[href*="/post/"])
  $('a[href*="/post/"]').each((i, el) => {
    const href = $(el).attr("href") || "";
    if (!href || href === "/post/create" || href.includes("/login")) return;

    const cleanHref = href.startsWith("http") ? href : `${BASE_URL}${href}`;
    const slugMatch = href.match(/\/post\/([^\s"'?#]+)/);
    if (!slugMatch) return;
    const slug = slugMatch[1].replace(/\/$/, "");
    if (seen.has(slug)) return;
    seen.add(slug);

    const postId = slug.split("/")[0];
    let title = $(el).attr("aria-label") || 
                $(el).attr("title") || 
                $(el).find("img").attr("alt") || 
                $(el).find("h2").text().trim() || 
                $(el).find("span.truncate").text().trim() || 
                $(el).text().trim() || 
                "3D Video";
    title = title.replace(/\s+/g, " ").trim();

    // Dapatkan poster / thumbnail
    const $img = $(el).find("img").first();
    let cover = $img.attr("src") || $img.attr("data-src") || "";
    if (!cover && $img.attr("srcset")) {
      cover = $img.attr("srcset").split(",")[0].trim().split(" ")[0];
    }
    // Jika gambar cdn-cgi kecil, tingkatkan resolusinya ke 480px agar jernih
    if (cover.includes("width=192,height=192")) {
      cover = cover.replace("width=192,height=192", "width=480,height=480");
    }

    const isVideo = $(el).find('svg.lucide-play, [class*="play"]').length > 0 || cover.includes("hls-") || cover.includes("poster");

    results.push({
      id: postId,
      slug,
      title,
      cover_url: cover,
      type: isVideo ? "video" : "image",
      duration: "",
      views: "",
      original_url: cleanHref,
    });
  });

  // 2. Fallback untuk selector versi lama (Livewire) jika Next.js selector tidak menemukan apapun
  if (results.length === 0) {
    $('[wire\\:key^="grid-"]').each((i, el) => {
      const $a = $(el).find("a[href*='/post/']").first();
      if (!$a.length) return;

      const href = $a.attr("href") || "";
      if (seen.has(href)) return;
      seen.add(href);

      const postId = href.match(/\/post\/(\d+)/)?.[1] || "";
      const slug = href.split("/post/")[1]?.replace(/\/$/, "") || postId;
      const title = $a.attr("alt") || $a.find("img").attr("alt") || "Unknown";
      const $img = $a.find("img").first();
      const cover = $img.attr("data-img") || $img.attr("src") || "";
      const isVideo = $a.attr("bunny") !== undefined;
      const duration = $a.find("span").filter((_, s) => $(s).text().match(/\d+:\d+/)).first().text().trim() || "";

      results.push({
        id: postId,
        slug,
        title: title.replace(/\s+/g, " ").trim(),
        cover_url: cover,
        type: isVideo ? "video" : "image",
        duration,
        views: "",
        original_url: href,
      });
    });
  }

  const filtered = filterBlockedItems(results);

  // Background caching ke database MongoDB
  if (filtered.length > 0 && page === 1 && !search && !tag) {
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
          description: "Detail video cadangan. Server pusat Porn3dx sedang offline.",
          original_url: cached.original_url || `${BASE_URL}/post/${slug}`,
          slug,
        };
      }
    } catch (cErr) {
      console.warn("[Porn3dx Cache] Lookup error:", cErr.message);
    }
    throw err;
  }

  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || 
                $("title").text().replace(" - Porn3DX", "").trim() || 
                "3D Video";

  // 1. Ekstraksi video streaming URL (mendukung HLS master.m3u8, direct video, dan Bunny CDN)
  let video_url = $("video source").attr("src") || $("video").attr("src") || "";
  let video_type = "image";

  if (!video_url) {
    const m3u8Match = html.match(/https?:\/\/[^"'\s\\]+master\.m3u8/i);
    if (m3u8Match) {
      video_url = m3u8Match[0];
    }
  }

  // Cek Bunny CDN iframe fallback
  if (!video_url) {
    const $iframe = $("iframe[src*='iframe.mediadelivery']").first();
    if ($iframe.length) {
      video_url = $iframe.attr("src") || "";
      video_type = "bunny";
    }
  }

  if (video_url) {
    if (video_url.includes(".m3u8")) {
      video_type = "m3u8";
    } else if (video_type !== "bunny") {
      video_type = "video";
    }
  }

  // 2. Poster / Cover URL
  let cover_url = $("video").attr("poster") || "";
  if (!cover_url && video_url.includes("master.m3u8")) {
    cover_url = video_url.replace("/master.m3u8", "/poster.jpg");
  }
  if (!cover_url) {
    $("img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-img") || "";
      if (src && (src.includes("poster") || src.includes("media") || src.includes("3dxmedia")) && !src.includes("avatar") && !cover_url) {
        cover_url = src;
      }
    });
  }

  // 3. Gambar galeri untuk postingan gambar/foto 3D
  const images = [];
  $("img").each((i, el) => {
    const src = $(el).attr("src") || $(el).attr("data-img") || "";
    if (src && !src.includes("avatar") && !src.includes("logo") && !src.includes("icon") && (src.includes("media") || src.includes("cdn-cgi"))) {
      images.push(src);
    }
  });

  // 4. Tags
  const tags = [];
  $("a[href*='/tag/'], a[href*='/?tag=']").each((i, el) => {
    const t = $(el).text().trim();
    if (t && !tags.includes(t)) tags.push(t);
  });

  // 5. Author & Deskripsi
  const author = $("header a[href^='/'], a[href^='/user']").first().text().trim() || "";
  const description = $("meta[name='description']").attr("content") || "";

  return {
    title,
    cover_url,
    video_url,
    video_type,
    images: [...new Set(images)],
    tags: filterBlockedTags(tags),
    author,
    description,
    original_url: url,
    slug,
  };
};
