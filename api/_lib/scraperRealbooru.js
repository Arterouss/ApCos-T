import { fetchWithDoH } from './dohAgent.js';
import * as cheerio from 'cheerio';
import { filterBlockedItems, filterBlockedTags, isBlockedItem, isBlockedText } from './contentFilter.js';

const BASE = 'https://realbooru.com';
const POSTS_PER_PAGE = 42; // realbooru uses 42 per page

const REALBOORU_BLACKLIST = [
  '-gay',
  '-yaoi',
  '-male_only',
  '-males_only',
  '-male_on_male',
  '-bara',
  '-shounen_ai',
  '-boys_love',
  '-bussy',
  '-danmei',
  '-twink',
  '-twinks',
  '-gachimuchi',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://realbooru.com/',
};

async function fetchHtml(url) {
  const res = await fetchWithDoH(url, { headers: HEADERS, timeout: 20000 });
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  return res.text();
}

/**
 * Scrape list of posts from Realbooru
 * @param {Object} options
 * @param {string} options.tags - Space-separated tags to search for
 * @param {number} options.page - Page number (1-based)
 * @param {number} options.limit - Results per page (for our pagination display)
 */
export async function getRealbooruPosts({ tags = '', page = 1, limit = 40 } = {}) {
  // If user searched for explicitly blocked terms (yaoi, gay, etc.), block it directly
  if (tags && isBlockedText(tags)) {
    return {
      posts: [],
      page,
      totalPages: 0,
      hasMore: false,
      tags: tags.trim(),
      blocked: true,
      message: 'Pencarian diblokir karena memuat konten terlarang (Yaoi / Gay / BL).',
      postsPerPage: POSTS_PER_PAGE,
    };
  }

  // Realbooru uses pid offset (pid = (page-1) * POSTS_PER_PAGE)
  const pid = (page - 1) * POSTS_PER_PAGE;

  // Append blacklist tags to search query so Realbooru backend excludes them
  const userTagList = tags.trim().split(/\s+/).filter(Boolean);
  const combinedTagList = [...userTagList];
  for (const b of REALBOORU_BLACKLIST) {
    if (!combinedTagList.includes(b)) {
      combinedTagList.push(b);
    }
  }

  const tagQuery = encodeURIComponent(combinedTagList.join(' '));
  const url = `${BASE}/index.php?page=post&s=list&tags=${tagQuery}&pid=${pid}`;

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const posts = [];
  const seen = new Set();

  // Realbooru's post grid: span.thumb or .thumb each has an <a> linking to page=post&s=view&id=...
  $('span.thumb, .thumb').each((_, el) => {
    const $el = $(el);
    const link = $el.find('a').first().attr('href') || '';
    const img = $el.find('img').first();
    const src = img.attr('src') || '';
    const title = img.attr('title') || img.attr('alt') || '';
    const idMatch = link.match(/id=(\d+)/);
    const id = idMatch ? idMatch[1] : null;

    if (!id || seen.has(id)) return;
    seen.add(id);

    const thumbnail = src.startsWith('//') ? 'https:' + src : src;
    const isVideo = title.toLowerCase().includes(' mp4') || title.toLowerCase().includes(' webm') ||
      thumbnail.includes('thumbnail') && title.toLowerCase().includes('video');

    // Parse tags from the title attribute (comma-separated or space-separated)
    const tags_list = title.split(',').map(t => t.trim()).filter(Boolean);

    posts.push({
      id,
      url: link.startsWith('http') ? link : `${BASE}/${link}`,
      thumbnail,
      tags: tags_list,
      tags_str: title,
      isVideo,
    });
  });

  // Detect total pages from paginator
  let totalPages = page;
  const lastPageLink = $('a').filter((_, el) => {
    const href = $(el).attr('href') || '';
    const alt = $(el).attr('alt') || '';
    const txt = $(el).text().trim();
    return href.includes('pid=') && !href.includes('pid=0') && (alt === 'last page' || txt === '>>' || txt === '&gt;&gt;');
  }).attr('href');

  if (lastPageLink) {
    const lastPidMatch = lastPageLink.match(/pid=(\d+)/);
    if (lastPidMatch) {
      const lastPid = parseInt(lastPidMatch[1]);
      totalPages = Math.ceil(lastPid / POSTS_PER_PAGE) + 1;
    }
  } else {
    let maxFound = page;
    $('.pagination a').each((_, el) => {
      const num = parseInt($(el).text().trim());
      if (!isNaN(num) && num > maxFound) maxFound = num;
    });
    totalPages = maxFound;
  }

  const hasMore = page < totalPages || $('a').filter((_, el) => $(el).text().trim() === '>' || $(el).attr('alt') === 'next').length > 0;

  // Double-filter on parsed items to ensure zero blocked content leaks through
  const safePosts = filterBlockedItems(posts);

  return {
    posts: safePosts,
    page,
    totalPages,
    hasMore,
    tags: tags.trim(),
    postsPerPage: POSTS_PER_PAGE,
  };
}

/**
 * Scrape detail of a single Realbooru post
 * @param {string} id - Post ID
 */
export async function getRealbooruPost(id) {
  const url = `${BASE}/index.php?page=post&s=view&id=${id}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  // Main media: image or video
  const mainImg = $('#image').attr('src') || $('img#image').attr('src');
  const videoSrc = $('video source').first().attr('src') || $('video').first().attr('src');
  const isVideo = !!videoSrc;

  // Also check for video link in original link
  let fileUrl = isVideo ? videoSrc : mainImg;
  if (!fileUrl) {
    const origLink = $('a[href*="/images/"]').filter((_, el) => {
      return $(el).text().toLowerCase().includes('original') || $(el).text().trim() === 'Original';
    }).first().attr('href');
    fileUrl = origLink || null;
  }

  if (fileUrl && fileUrl.startsWith('//')) fileUrl = 'https:' + fileUrl;

  // Alternative links (WebM, MP4 variants)
  const altLinks = [];
  $('a[href*="/images/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (href && (href.endsWith('.mp4') || href.endsWith('.webm') || href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.gif'))) {
      const fullHref = href.startsWith('//') ? 'https:' + href : href;
      altLinks.push({ url: fullHref, label: text || 'Download' });
    }
  });

  // Tags from sidebar - look for links like index.php?page=post&s=list&tags=xxx
  const rawTags = [];
  const tagTypes = {};
  $('a[href*="tags="]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    if (!text || text.includes('?') || text.includes('+') || text.includes('-') || text.length < 2) return;
    if (!rawTags.includes(text)) {
      rawTags.push(text);
      const liClass = $(el).parent('li').attr('class') || '';
      if (liClass.includes('artist')) tagTypes[text] = 'artist';
      else if (liClass.includes('character')) tagTypes[text] = 'character';
      else if (liClass.includes('copyright') || liClass.includes('series')) tagTypes[text] = 'series';
      else tagTypes[text] = 'general';
    }
  });

  const title = $('title').text().replace(/\s*\|.*$/, '').trim() || `Post #${id}`;
  const score = $('[title*="score"], #score').text().trim() || '0';
  const rating = $('li:contains("Rating")').text().replace('Rating:', '').trim() || 'explicit';

  // Check if post itself is blocked
  const postData = {
    id,
    url,
    title,
    tags: rawTags,
  };

  if (isBlockedItem(postData)) {
    return {
      id,
      isBlocked: true,
      message: 'Post ini tidak dapat ditampilkan karena termasuk konten terlarang (Yaoi / Gay / BL).',
    };
  }

  // Filter tags list to exclude blocked tags
  const safeTags = filterBlockedTags(rawTags);

  return {
    id,
    url,
    title,
    fileUrl,
    fileType: isVideo ? (videoSrc?.endsWith('.webm') ? 'webm' : 'mp4') : 'image',
    isVideo,
    thumbnail: fileUrl ? fileUrl.replace('/images/', '/thumbnails/').replace(/\.(mp4|webm|gif|png|jpg)$/, '.jpg') : null,
    tags: safeTags,
    tagTypes,
    altLinks,
    score,
    rating,
  };
}

/**
 * Get popular/trending tags from Realbooru (top search suggestions)
 */
export async function getRealbooruTags(search = '') {
  try {
    if (search && isBlockedText(search)) {
      return [];
    }

    const url = search
      ? `${BASE}/index.php?page=tags&s=list&search=${encodeURIComponent(search)}&sort=count&order=desc`
      : `${BASE}/index.php?page=tags&s=list&sort=count&order=desc`;

    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const tags = [];
    $('table tr').each((_, row) => {
      const tds = $(row).find('td');
      if (tds.length < 2) return;
      const name = $(tds[1]).find('a').text().trim();
      const countText = $(tds[0]).text().trim();
      const count = parseInt(countText.replace(/,/g, '')) || 0;
      if (name && count > 0) {
        tags.push({ name, count });
      }
    });

    const safeTags = filterBlockedTags(tags);
    return safeTags.slice(0, 50);
  } catch (e) {
    console.error('[Realbooru Tags Error]', e.message);
    return [];
  }
}
