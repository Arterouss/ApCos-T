import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://hentaiplay.net';
const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

const fetchZenRows = async (targetUrl) => {
  const url = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(targetUrl)}&premium_proxy=true`;
  console.log(`[HentaiPlay ZenRows] Fetching ${targetUrl}`);
  const response = await axios.get(url, { timeout: 60000 });
  return response.data;
};

// Scrape list: latest, search, or page
export const scrapeHentaiPlayList = async (page = 1, search = '') => {
  let url;
  if (search) {
    url = `${BASE_URL}/?s=${encodeURIComponent(search)}${page > 1 ? `&paged=${page}` : ''}`;
  } else {
    url = page > 1 ? `${BASE_URL}/page/${page}/` : `${BASE_URL}/`;
  }

  const html = await fetchZenRows(url);
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

  return { videos, page, totalPages };
};

// Scrape detail page for a video
export const scrapeHentaiPlayVideo = async (slug) => {
  const url = `${BASE_URL}/${slug}/`;
  const html = await fetchZenRows(url);
  const $ = cheerio.load(html);

  const title = $('h1.entry-title, h1').first().text().trim();
  const cover = $('meta[property="og:image"]').attr('content') || '';

  // Find iframe embed
  let embedUrl = null;
  $('iframe').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src && (src.includes('embed') || src.includes('player') || src.includes('video') || src.includes('hentaiplay'))) {
      embedUrl = embedUrl || src;
    }
  });

  // Fallback: look in scripts for embed URL or stream URL
  if (!embedUrl) {
    $('script').each((_, el) => {
      const text = $(el).html() || '';
      const iframeMatch = text.match(/iframe[^>]*src=['"](https?:\/\/[^'"]+)['"]/i);
      if (iframeMatch && !embedUrl) embedUrl = iframeMatch[1];
      
      const streamMatch = text.match(/['"]?(https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/);
      if (streamMatch && !embedUrl) embedUrl = streamMatch[1];
    });
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
    tags,
    description,
    original_url: url,
  };
};
