import axios from "axios";
import dns from "dns";
import { filterBlockedItems, filterBlockedTags } from "./contentFilter.js";

// Ensure IPv4 first on Node environments to avoid Windows IPv6 resolution stall
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}

const BASE_URL = "https://doujin.desu.xxx";
const API_SECRET = "dfdf72051dbfdc7d76889ebd31324e74";
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

// Encryption secret salt used by DoujinDesu SPA (reverse-engineered)
const SECRET_SALT = "doujindesu-scrapers-cannot-read-this-super-secret-salt-2026-v2";
const TIME_WINDOW_MS = 3600000;

function deriveKey(timeSlot) {
  const s = SECRET_SALT + "_" + timeSlot;
  let l = 0;
  for (let n = 0; n < s.length; n++) {
    l = (l << 5) - l + s.charCodeAt(n);
    l |= 0;
  }
  let i = "";
  let d = Math.abs(l) || 123456789;
  for (let n = 0; n < 32; n++) {
    d = (d * 1664525 + 1013904223) % 4294967296;
    i += String.fromCharCode(33 + (d % 93));
  }
  return i;
}

function getCandidateKeys() {
  const now = Date.now();
  const currentSlot = Math.floor(now / TIME_WINDOW_MS);
  return [deriveKey(currentSlot), deriveKey(currentSlot - 1), deriveKey(currentSlot + 1)];
}

function xorDecrypt(hexStr, key) {
  const bytes = [];
  for (let x = 0; x < hexStr.length; x += 2) {
    const chunk = hexStr.substring(x, x + 2);
    if (!chunk) break;
    bytes.push(parseInt(chunk, 16));
  }
  const chars = [];
  const keyLen = key.length;
  let seed = 42;
  for (let x = 0; x < bytes.length; x++) {
    const byteVal = bytes[x];
    const keyVal = key.charCodeAt(x % keyLen);
    const decryptedByte = byteVal ^ keyVal ^ (x * 13) ^ seed;
    chars.push(String.fromCharCode(decryptedByte & 255));
    seed = (seed + byteVal) % 256;
  }
  return chars.join("");
}

function decryptResponse(payload) {
  if (!payload || typeof payload !== "object" || !payload._enc_resp_) {
    return payload; // already unencrypted or plaintext
  }
  const encHex = payload._enc_resp_;
  const keys = getCandidateKeys();
  for (const k of keys) {
    try {
      const rawDecoded = xorDecrypt(encHex, k);
      const uriDecoded = decodeURIComponent(rawDecoded);
      return JSON.parse(uriDecoded);
    } catch {}
  }
  throw new Error("Gagal mendekripsi respons DoujinDesu API.");
}

// Fetch helper: Try direct first (~200ms), fallback to ZenRows if network blocks
async function fetchDoujinAPI(endpoint, params = {}) {
  const fullUrl = `${BASE_URL}${endpoint}`;
  
  // 1. Try Direct Request (Direct headers bypass CF Turnstile on API endpoints)
  try {
    const res = await axios.get(fullUrl, {
      params,
      headers: {
        "X-App-Secret": API_SECRET,
        "x-app-secret": API_SECRET,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    return decryptResponse(res.data);
  } catch (directErr) {
    console.warn(`[Doujin Direct API] Failed (${directErr.message}), falling back to ZenRows...`);
  }

  // 2. Fallback to ZenRows Premium Proxy
  try {
    const queryStr = new URLSearchParams(params).toString();
    const targetWithQuery = queryStr ? `${fullUrl}?${queryStr}` : fullUrl;
    const proxyUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(targetWithQuery)}&premium_proxy=true`;
    
    const res = await axios.get(proxyUrl, {
      headers: {
        "X-App-Secret": API_SECRET,
        "x-app-secret": API_SECRET
      },
      timeout: 30000
    });
    return decryptResponse(res.data);
  } catch (proxyErr) {
    console.error(`[Doujin Scraper API] Error: ${proxyErr.message}`);
    throw new Error("Gagal mengambil data dari DoujinDesu.");
  }
}

export const scrapeDoujinList = async ({ page = 1, type = "", genre = "", search = "" }) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limit = 24;
  const offset = (pageNum - 1) * limit;

  const params = {
    limit,
    offset
  };

  if (search && search.trim()) {
    params.search = search.trim();
  } else if (genre && genre.trim()) {
    // API expects lowercase genre slug
    params.genre = genre.trim().toLowerCase().replace(/\s+/g, "-");
  } else if (type === "manga" || type === "doujin" || type === "doujinshi") {
    params.type = "doujinshi,manga";
    params.sort = "latest_chapter";
  } else if (type === "manhwa") {
    params.type = "manhwa";
    params.sort = "latest_chapter";
  } else {
    params.sort = "latest_chapter";
  }

  const rawList = await fetchDoujinAPI("/api/manga", params);
  const list = Array.isArray(rawList) ? rawList : (rawList?.data || []);

  const results = list.map((item) => {
    let latest_chapter = "";
    if (Array.isArray(item.chapters) && item.chapters.length > 0) {
      const topChap = item.chapters[0];
      latest_chapter = topChap.chapter_number ? `Ch. ${topChap.chapter_number}` : "";
    } else if (item.chapter_count) {
      latest_chapter = `Ch. ${item.chapter_count}`;
    }

    const genreList = Array.isArray(item.manga_genres)
      ? item.manga_genres.map((g) => g.genres?.name).filter(Boolean)
      : [];

    return {
      id: item.id || item.slug,
      slug: item.slug,
      title: item.title,
      cover_url: item.cover_url,
      thumbnail: item.cover_url,
      type: item.type ? item.type.toUpperCase() : "DOUJIN",
      latest_chapter,
      score: item.rating ? String(item.rating) : null,
      rating: item.rating || null,
      genres: genreList,
      original_url: `${BASE_URL}/manga/${item.slug}`
    };
  });

  return filterBlockedItems(results);
};

export const scrapeDoujinDetail = async (slug) => {
  // Strip URL prefix or manga/ if passed
  const cleanSlug = slug
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^\/manga\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  const data = await fetchDoujinAPI(`/api/manga/${encodeURIComponent(cleanSlug)}`);

  const genreNames = Array.isArray(data.manga_genres)
    ? data.manga_genres.map((g) => g.genres?.name).filter(Boolean)
    : [];

  const filteredGenres = filterBlockedTags(genreNames);

  // Sort genres to put NTR/Netorare first
  const sortedGenres = filteredGenres.sort((a, b) => {
    const aIsNtr = a.toLowerCase().includes("ntr") || a.toLowerCase().includes("netorare");
    const bIsNtr = b.toLowerCase().includes("ntr") || b.toLowerCase().includes("netorare");
    if (aIsNtr && !bIsNtr) return -1;
    if (!aIsNtr && bIsNtr) return 1;
    return 0;
  });

  const chapters = (data.chapters || []).map((ch) => {
    let dateStr = "";
    if (ch.created_at) {
      try {
        dateStr = new Date(ch.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      } catch {}
    }

    return {
      id: ch.id,
      slug: ch.id, // ID is used directly to fetch chapter pages
      title: ch.title || `Chapter ${ch.chapter_number}`,
      chapter_number: ch.chapter_number,
      date: dateStr,
      original_url: `${BASE_URL}/reader/${ch.id}`
    };
  });

  return {
    id: data.id,
    title: data.title || "Unknown Title",
    cover_url: data.cover_url || "",
    thumbnail: data.cover_url || "",
    synopsis: data.description ? data.description.replace(/\n/g, "<br/>") : "Tidak ada sinopsis.",
    genres: sortedGenres,
    chapters,
    status: data.status ? data.status.toUpperCase() : "UNKNOWN",
    type: data.type || "manga",
    rating: data.rating || null,
    author: data.author || "",
    artist: data.artist || "",
    original_url: `${BASE_URL}/manga/${cleanSlug}`,
    slug: data.slug || cleanSlug
  };
};

export const scrapeDoujinChapter = async (slugOrId) => {
  const cleanId = slugOrId
    .replace(/^https?:\/\/[^\/]+/, "")
    .replace(/^\/reader\//, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  let chapterId = cleanId;

  // Check if cleanId is NOT a UUID (e.g. legacy slug 'manga-name-chapter-1')
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  if (!isUuid) {
    const match = cleanId.match(/^(.*?)-chapter-(\d+)/i);
    if (match) {
      const mangaSlug = match[1];
      const chNum = parseInt(match[2]);
      try {
        const detail = await fetchDoujinAPI(`/api/manga/${encodeURIComponent(mangaSlug)}`);
        const matchingChap = (detail.chapters || []).find((c) => c.chapter_number === chNum);
        if (matchingChap && matchingChap.id) {
          chapterId = matchingChap.id;
        }
      } catch (err) {
        console.warn(`[Doujin Chapter Legacy Resolver] Could not resolve legacy chapter: ${cleanId}`, err.message);
      }
    }
  }

  const data = await fetchDoujinAPI(`/api/chapters/${encodeURIComponent(chapterId)}`);

  const rawImages = data.content_urls || [];
  const images = rawImages.map((img) =>
    img.startsWith("http") ? `/api/doujin/image-proxy?url=${encodeURIComponent(img)}` : img
  );

  return {
    id: data.id,
    title: data.title || `Chapter ${data.chapter_number}`,
    images,
    mangaSlug: data.manga_slug || "",
    mangaTitle: data.manga_title || "",
    nextSlug: data.next_id || null,
    prevSlug: data.prev_id || null,
    original_url: `${BASE_URL}/reader/${chapterId}`
  };
};
