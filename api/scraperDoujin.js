import * as cheerio from "cheerio";
import axios from "axios";

const BASE_URL = "https://doujin.desu.xxx";
const SCRAPER_API_KEY = "4a21d9f2cfa3ccf27c74ba8aec026c43";

const fetchScraperAPI = async (targetUrl) => {
  const url = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&render=true`;
  console.log(`[Doujin ScraperAPI] Fetching ${targetUrl}`);
  try {
    const r = await axios.get(url, { timeout: 45000 });
    return r.data;
  } catch (e) {
    console.error(`[Doujin ScraperAPI] Failed: ${e.message}`);
    throw new Error("Gagal mengambil data dari DoujinDesu. Kemungkinan terhalang Cloudflare.");
  }
};

export const scrapeDoujinList = async ({ page = 1, type = "", genre = "", search = "" }) => {
  let url = BASE_URL;
  
  if (search) {
    url = `${BASE_URL}/search?q=${encodeURIComponent(search)}`;
  } else if (genre) {
    url = `${BASE_URL}/genres/${genre}${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "manga" || type === "doujin") {
    url = `${BASE_URL}/doujin${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "manhwa") {
    url = `${BASE_URL}/manhwa${page > 1 ? '?page=' + page : ''}`;
  } else if (type === "all") {
    url = `${BASE_URL}/explore${page > 1 ? '?page=' + page : ''}`;
  } else {
    url = page > 1 ? `${BASE_URL}/?page=${page}` : BASE_URL;
  }

  const html = await fetchScraperAPI(url);
  const $ = cheerio.load(html);
  
  const results = [];
  const seen = new Set();

  $('a[href*="/manga/"]').each((i, el) => {
    const $a = $(el);
    const $img = $a.find('img');
    if ($img.length === 0) return;
    
    const href = $a.attr('href');
    if (seen.has(href)) return;
    seen.add(href);

    const slug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
    const cover = $img.attr('src') || $img.attr('data-src') || null;

    const innerText = $a.text().trim();
    const lines = innerText.split('\n').map(l => l.trim()).filter(Boolean);
    let typeStr = lines[0] || "Doujin";

    let title = "Unknown";
    let latest_chapter = "";
    
    let $container = $a.parent();
    for (let depth = 0; depth < 5 && $container.length; depth++) {
      const $titleA = $container.find(`a[href="${href}"]`).filter((_, ta) => $(ta).find('img').length === 0 && ta !== el);
      if ($titleA.length > 0 && $titleA.text().trim().length > 0) {
        title = $titleA.text().trim();
        break;
      }
      $container = $container.parent();
    }
    
    if (title === "Unknown" && lines.length > 1) {
      title = lines.find((l, idx) => idx > 0 && l.length > 3 && !l.match(/^[\d.]+$/) && !l.includes('READ')) || lines[1] || "Unknown";
    }

    $container = $a.parent();
    for (let depth = 0; depth < 5 && $container.length; depth++) {
      const $chA = $container.find('a[href*="/reader/"]');
      if ($chA.length > 0) {
        latest_chapter = $chA.text().trim().replace(/\n/g, ' ').substring(0, 40);
        break;
      }
      $container = $container.parent();
    }

    results.push({
      id: slug,
      slug,
      title,
      cover_url: cover,
      type: typeStr,
      latest_chapter,
      original_url: href
    });
  });

  return results;
};

export const scrapeDoujinDetail = async (slug) => {
  const url = slug.includes('/') ? `${BASE_URL}/${slug}` : `${BASE_URL}/manga/${slug}`;
  const html = await fetchScraperAPI(url);
  const $ = cheerio.load(html);

  const title = $('h1').text().trim() || $('h2').first().text().trim() || "Unknown Title";
  
  let cover_url = "";
  $('img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || "";
    if (src.includes('pic.desu.xxx/content/web') || src.includes('cover')) {
      if (!cover_url) cover_url = src;
    }
  });
  if (!cover_url) {
    cover_url = $('img').first().attr('src') || $('img').first().attr('data-src') || "";
  }

  const synopsisPs = [];
  $('p').each((i, el) => {
    synopsisPs.push($(el).text().trim());
  });
  const synopsis = synopsisPs.length > 0 ? synopsisPs.join('<br/><br/>') : "Tidak ada sinopsis.";

  let genres = [];
  $('a[href*="/genres/"]').each((i, el) => {
    genres.push($(el).text().trim());
  });
  
  // Sort genres to put NTR first!
  genres = genres.sort((a, b) => {
    const aIsNtr = a.toLowerCase().includes('ntr') || a.toLowerCase().includes('netorare');
    const bIsNtr = b.toLowerCase().includes('ntr') || b.toLowerCase().includes('netorare');
    if (aIsNtr && !bIsNtr) return -1;
    if (!aIsNtr && bIsNtr) return 1;
    return 0;
  });

  const chapters = [];
  $('a[href*="/reader/"]').each((i, el) => {
    const $a = $(el);
    const href = $a.attr('href');
    if (!href) return;
    const cSlug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
    const parts = $a.text().trim().split('\n').map(s => s.trim());
    
    chapters.push({
      id: cSlug,
      slug: cSlug,
      title: parts.length > 1 ? `Chapter ${parts[0]} - ${parts[1]}` : $a.text().trim(),
      date: parts.length > 2 ? parts[2] : "",
      original_url: href
    });
  });

  let status = "Unknown";
  $('div, span').each((i, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text === 'ongoing' || text === 'completed') status = $(el).text().trim();
  });

  return { title, cover_url, synopsis, genres, chapters, status, original_url: url, slug };
};

export const scrapeDoujinChapter = async (slug) => {
  const url = slug.includes('/') ? `${BASE_URL}/${slug}` : `${BASE_URL}/reader/${slug}`;
  const html = await fetchScraperAPI(url);
  const $ = cheerio.load(html);

  const title = $('h1, h2, h3').first().text().trim() || "Chapter";
  
  const images = [];
  $('img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || "";
    if ((src.includes('pic.desu.xxx') || src.includes('content') || src.includes('pages')) && !src.includes('banner') && !src.includes('logo')) {
      images.push(src);
    }
  });

  let nextSlug = null;
  let prevSlug = null;

  $('a[href*="/reader/"]').each((i, el) => {
    const $a = $(el);
    const text = $a.text().toLowerCase();
    const icon = $a.html().toLowerCase();
    const href = $a.attr('href');
    if (!href) return;
    
    if (text.includes('next') || icon.includes('right')) {
      nextSlug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
    }
    if (text.includes('prev') || text.includes('kembali') || icon.includes('left')) {
      prevSlug = href.replace(/https?:\/\/[^\/]+/, '').replace(/^\//, '').replace(/\/$/, '');
    }
  });

  let mangaSlug = null;
  const backBtn = $('a[href*="/manga/"]').first().attr('href');
  if (backBtn) {
    mangaSlug = backBtn.split('/manga/')[1].replace(/\/$/, '');
  }

  return { title, images, mangaSlug, nextSlug, prevSlug, original_url: url };
};
