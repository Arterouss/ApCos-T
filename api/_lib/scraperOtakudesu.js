import axios from 'axios';
import https from 'https';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://otakudesu.blog';
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

const sslAgent = new https.Agent({
  rejectUnauthorized: false,
});

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': BASE_URL + '/',
};

// In-memory HTML cache (TTL: 15 minutes)
const pageCache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

const fetchPage = async (url) => {
  const cached = pageCache.get(url);
  if (cached && (Date.now() - cached.time < CACHE_TTL)) {
    console.log(`[Otakudesu Cache] Serving ${url} from cache`);
    return cheerio.load(cached.data);
  }

  const isVercel = Boolean(process.env.VERCEL);
  const directTimeout = isVercel ? 2500 : 6000;

  // 1. Try Direct request (fast in local environment)
  try {
    console.log(`[Otakudesu Direct] Fetching: ${url}`);
    const { data } = await axios.get(url, {
      headers: HEADERS,
      httpsAgent: sslAgent,
      timeout: directTimeout,
    });

    if (typeof data === 'string' && (data.includes('venz') || data.includes('episodelist') || data.includes('posttl') || data.includes('chi_lst'))) {
      pageCache.set(url, { data, time: Date.now() });
      return cheerio.load(data);
    }

    if (typeof data === 'string' && (data.includes('Just a moment...') || data.includes('cf-browser-verification') || data.includes('Cloudflare'))) {
      throw new Error('Cloudflare challenge detected');
    }

    pageCache.set(url, { data, time: Date.now() });
    return cheerio.load(data);
  } catch (directErr) {
    console.warn(`[Otakudesu Direct] Failed (${directErr.message}), falling back to ZenRows proxy...`);
  }

  // 2. Fallback to ZenRows proxy (with Indonesian IP to bypass Cloudflare block on Vercel & GitHub Actions)
  try {
    const proxyUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(url)}&premium_proxy=true&proxy_country=id`;
    console.log(`[Otakudesu ZenRows] Fetching via proxy (ID): ${url}`);
    const { data } = await axios.get(proxyUrl, {
      httpsAgent: sslAgent,
      timeout: 45000,
    });

    pageCache.set(url, { data, time: Date.now() });
    return cheerio.load(data);
  } catch (proxyErr) {
    console.error(`[Otakudesu ZenRows] Proxy error: ${proxyErr.message}`);
    // If we have stale cached data, use it as last resort
    if (cached) {
      console.warn(`[Otakudesu Fallback] Serving stale cache for ${url}`);
      return cheerio.load(cached.data);
    }
    throw new Error(`Gagal memuat halaman anime dari Otakudesu (${proxyErr.message})`);
  }
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
  $('.venz ul li').each((_, el) => {
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

  $('.venz ul li').each((_, el) => {
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

// Simple in-memory cache for resolved stream URLs
const streamCache = new Map();

// Helper to post to Otakudesu admin-ajax (with proxy fallback for Vercel)
const postAdminAjax = async (params) => {
  const body = new URLSearchParams(params).toString();

  // 1. Try Direct first
  try {
    const res = await axios.post(`${BASE_URL}/wp-admin/admin-ajax.php`, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': HEADERS['User-Agent'],
        'Referer': BASE_URL + '/',
      },
      timeout: 6000,
    });
    if (res.data?.data) return res.data.data;
  } catch (directErr) {
    console.warn(`[Otakudesu Stream Direct] Failed (${directErr.message}), falling back to ZenRows proxy...`);
  }

  // 2. Fallback to ZenRows proxy (with Indonesian IP to bypass Cloudflare)
  const proxyUrl = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(`${BASE_URL}/wp-admin/admin-ajax.php`)}&premium_proxy=true&proxy_country=id`;
  const res = await axios.post(proxyUrl, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': HEADERS['User-Agent'],
    },
    timeout: 30000,
  });

  if (res.data?.data) return res.data.data;
  throw new Error('Gagal mendapatkan respon dari server streaming');
};

// Helper to fetch stream iframe URL via Otakudesu admin-ajax
export const fetchStreamUrl = async ({ id, i, q, nonceAction, streamAction }) => {
  const cacheKey = `${id}_${q}_${i}`;
  if (streamCache.has(cacheKey)) {
    return { url: streamCache.get(cacheKey), cached: true };
  }

  const nAction = nonceAction || 'aa1208d27f29ca340c92c66d1926f13f';
  const sAction = streamAction || '2a3505c93b0035d3f455df82bf976b84';

  // 1. Get nonce
  const nonce = await postAdminAjax({ action: nAction });
  if (!nonce) throw new Error('Gagal mendapatkan nonce token');

  // 2. Fetch stream iframe
  const base64Data = await postAdminAjax({
    id: String(id),
    i: String(i),
    q: String(q),
    nonce: nonce,
    action: sAction,
  });
  if (!base64Data) throw new Error('Gagal mendapatkan data stream iframe');

  const decodedHtml = Buffer.from(base64Data, 'base64').toString('utf-8');
  const $ = cheerio.load(decodedHtml);
  let iframeSrc = $('iframe').attr('src') || '';
  if (iframeSrc.startsWith('//')) iframeSrc = 'https:' + iframeSrc;

  if (iframeSrc) {
    streamCache.set(cacheKey, iframeSrc);
  }

  return {
    url: iframeSrc,
    html: decodedHtml,
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. EPISODE STREAMING
// ═══════════════════════════════════════════════════════════════════════════
export const scrapeEpisodeStreaming = async (slug) => {
  const url = `${BASE_URL}/episode/${slug}/`;
  const $ = await fetchPage(url);
  const rawHtml = $.html();

  const title = $('h1.posttl, h1').first().text().trim();

  // ── Extract actions for ajax streaming ───────────────────────────────
  const nonceMatch = rawHtml.match(/data:\s*\{\s*action:\s*['"]([a-f0-9]{32})['"]\s*\}/);
  const nonceAction = nonceMatch ? nonceMatch[1] : 'aa1208d27f29ca340c92c66d1926f13f';

  const allActions = [...rawHtml.matchAll(/action:\s*['"]([a-f0-9]{32})['"]/g)].map(m => m[1]);
  const streamAction = allActions.find(a => a !== nonceAction) || '2a3505c93b0035d3f455df82bf976b84';

  // ── Parse Qualities and Mirrors ──────────────────────────────────────
  const qualities = {};
  $('.mirrorstream ul').each((_, ul) => {
    const $ul = $(ul);
    const className = $ul.attr('class') || '';
    const qMatch = className.match(/m(\d+p)/i);
    const quality = qMatch ? qMatch[1] : 'unknown';

    if (!qualities[quality]) {
      qualities[quality] = [];
    }

    $ul.find('li a').each((_, a) => {
      const $a = $(a);
      const name = $a.text().trim();
      const dataContent = $a.attr('data-content');
      if (dataContent) {
        try {
          const payload = JSON.parse(Buffer.from(dataContent, 'base64').toString('utf-8'));
          qualities[quality].push({
            name,
            quality,
            id: payload.id,
            i: payload.i,
            q: payload.q,
          });
        } catch (e) {}
      }
    });
  });

  // Default fallback iframe
  let defaultStreamUrl = '';
  const mainIframe = $('#embed_holder iframe, .responsive-embed-stream iframe').first();
  if (mainIframe.length) {
    const src = mainIframe.attr('src') || mainIframe.attr('data-src') || '';
    if (src) {
      defaultStreamUrl = src.startsWith('//') ? 'https:' + src : src;
    }
  }

  // Determine available resolutions sorted descending (720p, 480p, 360p)
  const qualityKeys = Object.keys(qualities).sort((a, b) => {
    const numA = parseInt(a) || 0;
    const numB = parseInt(b) || 0;
    return numB - numA;
  });

  // Try to resolve the highest quality (e.g. 720p) first mirror immediately
  let selectedQuality = qualityKeys[0] || '360p';
  let selectedServer = qualities[selectedQuality]?.[0]?.name || 'Default';

  if (qualityKeys.length > 0 && qualities[selectedQuality]?.[0]) {
    try {
      const firstMirror = qualities[selectedQuality][0];
      const streamRes = await fetchStreamUrl({
        id: firstMirror.id,
        i: firstMirror.i,
        q: firstMirror.q,
        nonceAction,
        streamAction,
      });
      if (streamRes.url) {
        defaultStreamUrl = streamRes.url;
      }
    } catch (e) {
      console.warn('[Otakudesu] Pre-fetch stream failed, fallback to default embed:', e.message);
    }
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

  const prevLink = $('.fleft a, .prevnav a').first();
  if (prevLink.length) {
    const prevHref = prevLink.attr('href') || '';
    const prevMatch = prevHref.match(/\/episode\/([^/]+)\/?$/);
    if (prevMatch) prevEpisode = prevMatch[1];
  }

  const nextLink = $('.fright a, .nextnav a').first();
  if (nextLink.length) {
    const nextHref = nextLink.attr('href') || '';
    const nextMatch = nextHref.match(/\/episode\/([^/]+)\/?$/);
    if (nextMatch) nextEpisode = nextMatch[1];
  }

  const allEpLink = $('a[href*="/anime/"]').first();
  if (allEpLink.length) {
    const allHref = allEpLink.attr('href') || '';
    const animeMatch = allHref.match(/\/anime\/([^/]+)\/?$/);
    if (animeMatch) animeSlug = animeMatch[1];
  }

  return {
    slug,
    title,
    qualities,
    qualityKeys,
    selectedQuality,
    selectedServer,
    defaultStreamUrl,
    nonceAction,
    streamAction,
    downloads,
    prevEpisode,
    nextEpisode,
    animeSlug,
    url,
  };
};
