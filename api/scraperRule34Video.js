import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://rule34video.com";

const SCRAPER_API_KEY = "4a21d9f2cfa3ccf27c74ba8aec026c43";

const fetchScraperAPI = async (targetUrl, useRender = false) => {
  const url = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}${useRender ? '&render=true' : ''}`;
  console.log(`[ScraperAPI Rule34] Fetching ${targetUrl} (render=${useRender})`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ScraperAPI returned status ${response.status}`);
  }
  return response.text();
};

export const scrapeRule34VideoList = async (page = 1, searchQuery = "") => {
  let url = `${BASE_URL}/latest-updates/${page}/`;
  if (searchQuery) {
    url = `${BASE_URL}/search/?q=${encodeURIComponent(searchQuery)}&from_videos=${page}`;
  }

  try {
    const html = await fetchScraperAPI(url);
    const $ = cheerio.load(html);

    const videos = [];
    $('.thumb, .item').each((_, el) => {
      const link = $(el).find('a[href*="/video/"]').first();
      if (!link.length) return; // Skip if no video link found
      
      const img = $(el).find('img').first();
      const titleEl = $(el).find('.thumb_title, .title, .name').first();
      const durationEl = $(el).find('.time, .duration').first();
      
      let href = link.attr('href');
      let imgSrc = img.attr('data-webp') || img.attr('data-original') || img.attr('data-src') || img.attr('src');
      let titleText = titleEl.text().trim() || link.attr('title') || img.attr('alt') || "Unknown Title";
      let durationText = durationEl.text().trim();

      if (href) {
        const urlObj = new URL(href, BASE_URL);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const slug = pathParts.join('/'); // "video/id/title"
        
        videos.push({
          id: slug,
          title: titleText,
          image_url: imgSrc,
          duration: durationText,
          slug: slug,
          original_url: urlObj.href
        });
      }
    });

    const nextBtn = $('.pagination .next, a[data-parameters*="from_videos"]');
    const hasMore = nextBtn.length > 0 || videos.length >= 20;

    return { videos, hasMore };
  } catch (error) {
    console.error("[Rule34Video Scraper Error]", error.message);
    throw error;
  }
};

export const scrapeRule34VideoDetail = async (slug) => {
  const url = slug.includes('rule34video.com') ? slug : `${BASE_URL}/${slug}`;

  try {
    const html = await fetchScraperAPI(url, true);
    const $ = cheerio.load(html);

    const titleEl = $('h1, h2, .title').first();
    const title = titleEl ? titleEl.text().trim() : "Unknown Video";
    
    // Look for video element or iframe
    let videoUrl = $('video source, video').first().attr('src');
    let iframeUrl = $('iframe[src*="embed"]').first().attr('src');
    
    // Fallback: search through script tags for KVS flashvars and embed URL
    if (!videoUrl || !iframeUrl) {
      $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (text.includes('kt_player') || text.includes('flashvars')) {
          if (!videoUrl) {
            const videoUrlMatch = text.match(/video_url:\s*['"]([^'"]+)['"]/);
            if (videoUrlMatch) videoUrl = videoUrlMatch[1];
          }
          if (!iframeUrl) {
            const embedMatch = text.match(/<iframe[^>]+src=['"]([^'"]+embed[^'"]+)['"]/);
            if (embedMatch) iframeUrl = embedMatch[1];
          }
        }
      });
    }

    // Ultimate fallback for iframe based on slug
    if (!iframeUrl && slug.includes('video/')) {
      const slugParts = slug.split('/').filter(Boolean);
      const videoId = slugParts[1]; // video/4539345/title
      if (videoId) iframeUrl = `${BASE_URL}/embed/${videoId}`;
    }
    
    const tags = [];
    $('.tag, .categories a, .tags a, a[href*="/tags/"]').each((_, el) => {
      const t = $(el).text().trim();
      if (t) tags.push(t);
    });
    
    return {
      title,
      video_url: videoUrl,
      iframe_url: iframeUrl,
      tags,
      original_url: url
    };
  } catch (error) {
    console.error("[Rule34Video Scraper Detail Error]", error.message);
    throw error;
  }
};
