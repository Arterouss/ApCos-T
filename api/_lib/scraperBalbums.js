import { fetchWithDoH } from './dohAgent.js';
import * as cheerio from 'cheerio';
import { filterBlockedItems } from './contentFilter.js';

const BALBUMS_BASE = 'https://balbums.st';
const BUNKR_DOMAINS = ['https://bunkr.cr', 'https://bunkr.is', 'https://bunkr.si', 'https://bunkr.ws'];

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Fetch HTML helper with DoH and fallback
 */
async function fetchHtml(url) {
  const res = await fetchWithDoH(url, {
    headers: {
      ...COMMON_HEADERS,
      'Referer': BALBUMS_BASE + '/',
    },
    timeout: 20000,
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  }

  return await res.text();
}

/**
 * Scrape Albums from balbums.st
 */
export async function getBalbumsAlbums({
  search = '',
  mode = 'broad',
  per = 20,
  sort = 'latest',
  page = 1,
} = {}) {
  const queryParams = new URLSearchParams({
    search: search.trim(),
    mode,
    per: String(per),
    sort,
    page: String(page),
  });

  const url = `${BALBUMS_BASE}/?${queryParams.toString()}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const albums = [];
  $('a:has(.card), a.card, .card').each((_, el) => {
    const card = $(el).hasClass('card') ? $(el) : $(el).find('.card');
    const linkEl = $(el).is('a') ? $(el) : $(el).closest('a').length ? $(el).closest('a') : $(el).find('a').first();
    const href = linkEl.attr('href') || $(el).attr('href') || '';

    // Extract album ID from bunkr link
    const idMatch = href.match(/\/a\/([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : null;

    const title = card.find('h3').text().trim() || 'Untitled Album';
    const filesText = card.find('span:contains("files")').text().trim();
    const filesCount = parseInt(filesText.replace(/[^0-9]/g, '')) || 0;
    
    // Thumbnail from thumb-img
    let thumb = card.find('img.thumb-img').attr('src') || '';
    if (!thumb || thumb.includes('/img/bunkr.svg')) {
      thumb = '';
    }

    if (id) {
      albums.push({
        id,
        title,
        files_count: filesCount,
        thumbnail: thumb,
        url: href,
        bunkr_id: id,
      });
    }
  });

  // Calculate pagination
  let totalPages = 1;
  $('a[href*="page="]').each((_, el) => {
    const text = $(el).text().trim();
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > totalPages) {
      totalPages = num;
    }
  });

  const hasNext = $('a:contains("Next")').length > 0 || page < totalPages;
  const filtered = filterBlockedItems(albums);

  return {
    albums: filtered,
    page: Number(page),
    totalPages,
    hasMore: hasNext,
    search: search.trim(),
    sort,
  };
}

/**
 * Scrape Album Detail from Bunkr
 */
export async function getBalbumsAlbumDetail(albumId) {
  let lastErr = null;

  for (const domain of BUNKR_DOMAINS) {
    try {
      const url = `${domain}/a/${albumId}`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      const title = $('h1').text().trim() || $('title').text().replace(/\|.*$/, '').trim() || `Album ${albumId}`;

      const files = [];
      $('.theItem').each((_, item) => {
        const name = $(item).find('.theName').text().trim();
        const size = $(item).find('.theSize').text().trim();
        const date = $(item).find('.theDate').text().trim();
        const thumb = $(item).find('.grid-images_box-img').attr('src') || '';
        const fileLink = $(item).find('a[href*="/f/"]').attr('href') || '';
        const fMatch = fileLink.match(/\/f\/([a-zA-Z0-9_-]+)/);
        const fileId = fMatch ? fMatch[1] : null;

        const isVideo = $(item).find('[class*="type-Video"], img[src*="video"]').length > 0 ||
          /\.(mp4|webm|mkv|mov|m4v|avi)$/i.test(name);
        const isImage = $(item).find('[class*="type-Image"]').length > 0 ||
          /\.(jpg|jpeg|png|webp|gif|avif)$/i.test(name);

        if (fileId) {
          files.push({
            id: fileId,
            name,
            size,
            date,
            thumbnail: thumb,
            isVideo,
            isImage,
            url: `${domain}/f/${fileId}`,
          });
        }
      });

      const filtered = filterBlockedItems(files);

      return {
        id: albumId,
        title,
        files: filtered,
        totalFiles: filtered.length,
        album_url: `${domain}/a/${albumId}`,
      };
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw lastErr || new Error(`Failed to load album ${albumId} from all mirrors.`);
}

/**
 * Resolve signed streaming and download URL from Bunkr's dl landing page
 */
async function resolveBunkrDownloadUrl(downloadUrl, fileTitle = '') {
  try {
    if (!downloadUrl) return null;

    // If it's already a direct media URL (not a /file/ landing page)
    if (/\.(mp4|m4v|webm|mkv|mov|jpg|jpeg|png|webp|gif)(\?|$)/i.test(downloadUrl) && !downloadUrl.includes('/file/')) {
      return downloadUrl;
    }

    const dlUrlObj = new URL(downloadUrl);
    const dlOrigin = dlUrlObj.origin;

    // Fetch the download landing page HTML
    const dlHtml = await fetchHtml(downloadUrl);
    const $ = cheerio.load(dlHtml);

    // Look for download button data-id or numeric id in URL
    let dataId = $('#download-btn').attr('data-id') || $('[data-id]').first().attr('data-id');
    if (!dataId) {
      const match = downloadUrl.match(/\/file\/([a-zA-Z0-9_-]+)/);
      if (match) dataId = match[1];
    }

    if (!dataId) {
      console.warn('[Bunkr Resolver] No data-id found on download page:', downloadUrl);
      return downloadUrl;
    }

    // Call Bunkr's metadata API
    const metaRes = await fetchWithDoH(`${dlOrigin}/api/_001_v2`, {
      method: 'POST',
      headers: {
        ...COMMON_HEADERS,
        'Content-Type': 'application/json',
        'Referer': downloadUrl,
        'Origin': dlOrigin,
      },
      body: JSON.stringify({ id: dataId }),
      timeout: 15000,
    });

    if (!metaRes.ok) {
      console.warn(`[Bunkr Resolver] _001_v2 returned HTTP ${metaRes.status}`);
      return downloadUrl;
    }

    const meta = await metaRes.json();
    if (!meta || !meta.mediafiles || !meta.path) {
      console.warn('[Bunkr Resolver] Invalid meta response from _001_v2:', meta);
      return downloadUrl;
    }

    // Call sign service to get token and expiry
    const cleanPath = decodeURIComponent(meta.path);
    const signUrl = `https://glb-apisign.cdn.cr/sign?path=${encodeURIComponent(cleanPath)}`;
    const signRes = await fetchWithDoH(signUrl, {
      headers: {
        ...COMMON_HEADERS,
        'Referer': `${dlOrigin}/`,
      },
      timeout: 15000,
    });

    if (!signRes.ok) {
      console.warn(`[Bunkr Resolver] sign service returned HTTP ${signRes.status}`);
      return downloadUrl;
    }

    const signData = await signRes.json();
    const finalUrl = new URL(meta.mediafiles + meta.path);
    const originalName = meta.original || fileTitle || '';
    if (originalName) finalUrl.searchParams.set('n', originalName);
    if (signData.token) finalUrl.searchParams.set('token', signData.token);
    if (signData.ex) finalUrl.searchParams.set('ex', signData.ex);

    return finalUrl.toString();
  } catch (err) {
    console.error('[Bunkr Resolver Error]', err.message);
    return downloadUrl;
  }
}

/**
 * Scrape single file direct download/stream link from Bunkr
 */
export async function getBalbumsFileDirect(fileId) {
  let lastErr = null;

  for (const domain of BUNKR_DOMAINS) {
    try {
      const url = `${domain}/f/${fileId}`;
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);

      const title = $('h1, .truncate, title').first().text().replace(/\|.*$/, '').trim();
      let downloadLink = $('a:contains("Download"), a[download]').attr('href') || $('a[href*="/file/"]').attr('href');

      if (downloadLink) {
        if (downloadLink.startsWith('/')) {
          downloadLink = new URL(downloadLink, domain).toString();
        }

        const resolvedUrl = await resolveBunkrDownloadUrl(downloadLink, title);
        const isMediaFile = /\.(mp4|m4v|webm|mkv|mov|jpg|jpeg|png|webp|gif)(\?|$)/i.test(resolvedUrl);
        const streamProxyUrl = isMediaFile
          ? `/api/balbums/media?url=${encodeURIComponent(resolvedUrl)}`
          : resolvedUrl;

        return {
          id: fileId,
          title,
          download_url: resolvedUrl,
          stream_url: streamProxyUrl,
          signed_url: resolvedUrl,
          landing_url: downloadLink,
        };
      }
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  throw lastErr || new Error(`Failed to resolve direct download for file ${fileId}.`);
}

