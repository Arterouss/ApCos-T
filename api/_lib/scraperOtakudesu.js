import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Referer': BASE_URL + '/',
};

const fetchPage = async (url) => {
  console.log(`[Otakudesu] Fetching: ${url}`);
  const { data } = await axios.get(url, {
    headers: HEADERS,
    timeout: 15000,
  });
  return cheerio.load(data);
};

// ─── Helper: parse anime card from list pages ────────────────────────────
const parseAnimeCard = ($, el) => {
  const $el = $(el);
  const link = $el.find('.thumbz a, a').first();
  const href = link.attr('href') || '';
  const img = $el.find('.thumbz img, img').first();
  const title = $el.find('.jdlflm').text().trim() || img.attr('alt') || '';
  const poster = img.attr('src') || img.attr('data-src') || '';
  const episode = $el.find('.epz').text().trim();
  const day = $el.find('.epztippy').text().trim() || $el.find('.newnime').text().trim();

  // Extract slug from URL
  const slugMatch = href.match(/\/anime\/([^/]+)\/?$/);
  const slug = slugMatch ? slugMatch[1] : href.replace(BASE_URL, '').replace(/^\/|\/$/g, '');

  return {
    slug,
    title,
    poster,
    episode,
    day,
    url: href,
  };
};

// ─── Helper: parse pagination ────────────────────────────────────────────
const parsePagination = ($) => {
  let currentPage = 1;
  let totalPages = 1;

  const current = $('.pagenavigation .page-numbers.current, .pagination .current').first();
  if (current.length) {
    currentPage = parseInt(current.text().trim()) || 1;
  }

  // Find the last page number
  $('.pagenavigation .page-numbers, .pagination a').each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text);
    if (!isNaN(num) && num > totalPages) {
      totalPages = num;
    }
  });

  // Also check "next" link to see if there are more pages
  const nextLink = $('.pagenavigation .next, .pagination .next').first();
  if (nextLink.length && totalPages <= currentPage) {
    totalPages = currentPage + 1;
  }

  return { currentPage, totalPages };
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. ONGOING ANIME LIST
// ═══════════════════════════════════════════════════════════════════════════
export const scrapeOngoingAnime = async (page = 1) => {
  const url = page > 1
    ? `${BASE_URL}/ongoing-anime/page/${page}/`
    : `${BASE_URL}/ongoing-anime/`;

  const $ = await fetchPage(url);
  const animeList = [];

  // Ongoing list uses .venz ul li structure
  $('.venz ul li, .detpost').each((_, el) => {
    const card = parseAnimeCard($, el);
    if (card.title) animeList.push(card);
  });

  const pagination = parsePagination($);

  return {
    animeList,
    page: page,
    totalPages: pagination.totalPages,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPLETED ANIME LIST
// ═══════════════════════════════════════════════════════════════════════════
export const scrapeCompletedAnime = async (page = 1) => {
  const url = page > 1
    ? `${BASE_URL}/complete-anime/page/${page}/`
    : `${BASE_URL}/complete-anime/`;

  const $ = await fetchPage(url);
  const animeList = [];

  $('.venz ul li, .detpost').each((_, el) => {
    const card = parseAnimeCard($, el);
    if (card.title) animeList.push(card);
  });

  const pagination = parsePagination($);

  return {
    animeList,
    page: page,
    totalPages: pagination.totalPages,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 3. SEARCH ANIME
// ═══════════════════════════════════════════════════════════════════════════
export const searchAnime = async (query) => {
  const url = `${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`;

  const $ = await fetchPage(url);
  const animeList = [];

  // Search results use .chi_lst structure
  $('.chi_lst ul li, .page ul li').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a').first();
    const href = link.attr('href') || '';
    const img = $el.find('img').first();
    const title = $el.find('h2').text().trim() || $el.find('h3').text().trim() || link.attr('title') || img.attr('alt') || '';
    const poster = img.attr('src') || img.attr('data-src') || '';

    // Extract genre list
    const genres = [];
    $el.find('.set a, .genres a').each((_, g) => {
      genres.push($(g).text().trim());
    });

    // Extract status/type info
    const status = $el.find('.set').text() || '';

    // Extract slug
    const slugMatch = href.match(/\/anime\/([^/]+)\/?$/);
    const slug = slugMatch ? slugMatch[1] : '';

    if (slug && title) {
      animeList.push({
        slug,
        title,
        poster,
        genres,
        status,
        url: href,
      });
    }
  });

  return { animeList, query };
};

// ═══════════════════════════════════════════════════════════════════════════
// 4. ANIME DETAIL
// ═══════════════════════════════════════════════════════════════════════════
export const scrapeAnimeDetail = async (slug) => {
  const url = `${BASE_URL}/anime/${slug}/`;
  const $ = await fetchPage(url);

  // ── Poster ───────────────────────────────────────────────────────────
  const poster = $('.fotoanime img').attr('src') || $('meta[property="og:image"]').attr('content') || '';

  // ── Metadata from .infozingle ────────────────────────────────────────
  const info = {};
  $('.infozingle p, .infozin p').each((_, el) => {
    const text = $(el).text().trim();
    const colonIdx = text.indexOf(':');
    if (colonIdx > -1) {
      const key = text.substring(0, colonIdx).trim().toLowerCase();
      const value = text.substring(colonIdx + 1).trim();
      info[key] = value;
    }
  });

  const title = info['judul'] || info['japanese'] || $('h1').first().text().trim();
  const titleJapanese = info['japanese'] || '';
  const score = info['skor'] || info['score'] || '';
  const status = info['status'] || '';
  const type = info['tipe'] || info['type'] || '';
  const totalEpisodes = info['total episode'] || info['episode'] || '';
  const duration = info['durasi'] || info['duration'] || '';
  const releaseDate = info['tanggal rilis'] || info['released'] || '';
  const studio = info['studio'] || '';

  // ── Genres ───────────────────────────────────────────────────────────
  const genres = [];
  $('.infozingle a, .infozin a').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (href.includes('/genres/')) {
      genres.push({
        name: $(el).text().trim(),
        slug: href.match(/\/genres\/([^/]+)/)?.[1] || '',
      });
    }
  });

  // ── Synopsis ─────────────────────────────────────────────────────────
  const synopsis = $('.sinopc').text().trim() || $('meta[name="description"]').attr('content') || '';

  // ── Episode List ─────────────────────────────────────────────────────
  const episodes = [];
  $('.episodelist ul li, .eptlist ul li').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a').first();
    const href = link.attr('href') || '';
    const epTitle = link.text().trim();
    const date = $el.find('.zemark, span').last().text().trim();

    const slugMatch = href.match(/\/episode\/([^/]+)\/?$/);
    const epSlug = slugMatch ? slugMatch[1] : '';

    if (epSlug) {
      episodes.push({
        slug: epSlug,
        title: epTitle,
        date,
        url: href,
      });
    }
  });

  return {
    slug,
    title,
    titleJapanese,
    poster,
    score,
    status,
    type,
    totalEpisodes,
    duration,
    releaseDate,
    studio,
    genres,
    synopsis,
    episodes,
    url,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. EPISODE STREAMING
// ═══════════════════════════════════════════════════════════════════════════
export const scrapeEpisodeStreaming = async (slug) => {
  const url = `${BASE_URL}/episode/${slug}/`;
  const $ = await fetchPage(url);

  const title = $('h1.posttl, h1').first().text().trim();

  // ── Streaming mirrors ────────────────────────────────────────────────
  const mirrors = [];
  
  // Primary: check #embed_holder iframe
  const mainIframe = $('#embed_holder iframe, .responsive-embed-stream iframe').first();
  if (mainIframe.length) {
    const src = mainIframe.attr('src') || mainIframe.attr('data-src') || '';
    if (src) {
      mirrors.push({
        name: 'Default',
        url: src.startsWith('//') ? 'https:' + src : src,
        quality: 'auto',
      });
    }
  }

  // Secondary: .mirrorstream buttons/links
  $('.mirrorstream ul li a, .mirrorstream ul li').each((_, el) => {
    const $el = $(el);
    const name = $el.text().trim();
    const dataContent = $el.attr('data-content') || '';
    
    // data-content may contain base64-encoded iframe HTML
    if (dataContent) {
      try {
        const decoded = Buffer.from(dataContent, 'base64').toString('utf-8');
        const $decoded = cheerio.load(decoded);
        const iframeSrc = $decoded('iframe').attr('src') || '';
        if (iframeSrc) {
          mirrors.push({
            name: name || 'Mirror',
            url: iframeSrc.startsWith('//') ? 'https:' + iframeSrc : iframeSrc,
            quality: name,
          });
        }
      } catch (e) {
        // Not base64, try direct href
        const href = $el.attr('href') || '';
        if (href && href !== '#') {
          mirrors.push({
            name: name || 'Mirror',
            url: href,
            quality: name,
          });
        }
      }
    }
  });

  // Fallback: look for iframe in scripts
  if (mirrors.length === 0) {
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      const iframeMatch = text.match(/iframe[^>]*src=['"]([^'"]+)['"]/i);
      if (iframeMatch) {
        mirrors.push({
          name: 'Extracted',
          url: iframeMatch[1].startsWith('//') ? 'https:' + iframeMatch[1] : iframeMatch[1],
          quality: 'auto',
        });
      }
    });
  }

  // ── Download links ───────────────────────────────────────────────────
  const downloads = [];
  $('.download ul li').each((_, el) => {
    const $el = $(el);
    const quality = $el.find('strong').text().trim();
    const links = [];
    $el.find('a').each((_, a) => {
      links.push({
        name: $(a).text().trim(),
        url: $(a).attr('href') || '',
      });
    });
    if (quality || links.length) {
      downloads.push({ quality, links });
    }
  });

  // ── Episode navigation ──────────────────────────────────────────────
  let prevEpisode = null;
  let nextEpisode = null;
  let animeSlug = null;

  // Previous
  const prevLink = $('.fleft a, .prevnav a').first();
  if (prevLink.length) {
    const prevHref = prevLink.attr('href') || '';
    const prevMatch = prevHref.match(/\/episode\/([^/]+)\/?$/);
    if (prevMatch) prevEpisode = prevMatch[1];
  }

  // Next
  const nextLink = $('.fright a, .nextnav a').first();
  if (nextLink.length) {
    const nextHref = nextLink.attr('href') || '';
    const nextMatch = nextHref.match(/\/episode\/([^/]+)\/?$/);
    if (nextMatch) nextEpisode = nextMatch[1];
  }

  // All episodes link → extract anime slug
  const allEpLink = $('a[href*="/anime/"]').first();
  if (allEpLink.length) {
    const allHref = allEpLink.attr('href') || '';
    const animeMatch = allHref.match(/\/anime\/([^/]+)\/?$/);
    if (animeMatch) animeSlug = animeMatch[1];
  }

  return {
    slug,
    title,
    mirrors,
    downloads,
    prevEpisode,
    nextEpisode,
    animeSlug,
    url,
  };
};
