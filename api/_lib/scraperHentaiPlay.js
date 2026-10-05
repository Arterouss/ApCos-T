import * as cheerio from 'cheerio';
import { filterBlockedItems, filterBlockedTags } from './contentFilter.js';
import { fetchWithProxy } from './fetchProxy.js';

const BASE_URL = 'https://hentaiplay.net';

// Scrape list: latest, search, or page
export const scrapeHentaiPlayList = async (page = 1, search = '') => {
  let url;
  if (search) {
    url = `${BASE_URL}/?s=${encodeURIComponent(search)}${page > 1 ? `&paged=${page}` : ''}`;
  } else {
    url = page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
  }

  const html = await fetchWithProxy(url, { js: false });
  const $ = cheerio.load(html);

  const videos = [];
  const seen = new Set();

  $('.post').each((_, el) => {
    const $el = $(el);

    // Title link is the direct video page URL
    const titleEl = $el.find('.entry-title, h2, h3').first();
    const titleLink = titleEl.find('a').first();
    const href = titleLink.attr('href') || '';
    const title = titleLink.text().trim() || titleEl.text().trim();

    if (!href || seen.has(href)) return;
    seen.add(href);

    // Slug: everything after BASE_URL
    const slug = href.replace(BASE_URL + '/', '').replace(/\/$/, '');

    // Thumbnail
    const img = $el.find('img').first();
    const cover = img.attr('src') || img.attr('data-src') || '';

    // Categories/tags
    const categories = [];
    $el.find('.post-categories a, .cat-links a').each((_, a) => {
      categories.push($(a).text().trim());
    });

    // data-id for embed if needed
    const dataId = $el.find('[data-id]').first().attr('data-id') || '';

    videos.push({
      id: slug,
      slug,
      title,
      cover_url: cover,
      categories,
      data_id: dataId,
      original_url: href,
    });
  });

  // Pagination
  const paginationText = $('.wp-pagenavi .pages').text() || '';
  const totalPagesMatch = paginationText.match(/of\s+(\d+)/i);
  const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;

  return { videos: filterBlockedItems(videos), page, totalPages };
};

// Scrape detail page for a video
export const scrapeHentaiPlayVideo = async (slug) => {
  const url = `${BASE_URL}/${slug}/`;
  const html = await fetchWithProxy(url, { js: false });
  const $ = cheerio.load(html);

  const title = $('h1.entry-title, h1').first().text().trim();
  let cover = $('meta[property="og:image"]').attr('content') || '';
  if (!cover) {
    cover = $('video').attr('poster') || '';
  }
  if (!cover) {
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      const posterMatch = text.match(/posterImage:\s*['"](https?:\/\/[^'"]+)['"]/i);
      if (posterMatch && !cover) cover = posterMatch[1];
    });
  }
  if (!cover) {
    cover = $('.entry-content img, .post-thumbnail img').first().attr('src') || '';
  }

  let embedUrl = null;

  // 1. Direct video source from <source> or <video> tags
  $('video source, source, video').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && (src.includes('.mp4') || src.includes('.m3u8') || src.includes('hentaiplanet'))) {
      if (!embedUrl) embedUrl = src;
    }
  });

  // 2. Look in scripts for fluidPlayer or direct video urls
  if (!embedUrl) {
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      const mp4Match = text.match(/https?:\/\/[^"'\s\\]+\.mp4/i);
      if (mp4Match && !embedUrl) embedUrl = mp4Match[0];

      const m3u8Match = text.match(/https?:\/\/[^"'\s\\]+\.m3u8/i);
      if (m3u8Match && !embedUrl) embedUrl = m3u8Match[0];

      const iframeMatch = text.match(/iframe[^>]*src=['"](https?:\/\/[^'"]+)['"]/i);
      if (iframeMatch && !embedUrl) embedUrl = iframeMatch[1];
    });
  }

  // 3. Iframe embed
  if (!embedUrl) {
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src && src !== '//' && src.length > 5 && !src.includes('ads') && !src.includes('banner')) {
        embedUrl = embedUrl || src;
      }
    });
  }

  // Normalize hentaiplanet to http since port 443 times out on their server
  if (embedUrl && embedUrl.includes('hentaiplanet.info')) {
    embedUrl = embedUrl.replace(/^https:\/\//i, 'http://');
  }

  // Tags
  const tags = [];
  $('.tagcloud a, .post-tags a, a[rel="tag"]').each((_, el) => {
    tags.push($(el).text().trim());
  });

  // Description
  const description = $('meta[name="description"]').attr('content') || '';

  return {
    slug,
    title,
    cover_url: cover,
    embed_url: embedUrl,
    tags: filterBlockedTags(tags),
    description,
    original_url: url,
  };
};
