import * as cheerio from "cheerio";
import fetch from "node-fetch";

const SCRAPER_API_KEY = "4a21d9f2cfa3ccf27c74ba8aec026c43";

// Helper for ScraperAPI
const fetchScraperAPI = async (targetUrl, useRender = false) => {
  const url = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}${useRender ? '&render=true' : ''}`;
  console.log(`[ScraperAPI] Fetching ${targetUrl}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ScraperAPI returned status ${response.status}`);
  }
  return response.text();
};

export const scrapePornavHDSearch = async (query, pageNum) => {
  try {
    const url = query 
      ? `https://pornavhd.com/page/${pageNum}/?s=${encodeURIComponent(query)}` 
      : `https://pornavhd.com/page/${pageNum}/`;
      
    const html = await fetchScraperAPI(url, true);
    const $ = cheerio.load(html);
    
    const posts = [];
    $('article, .post, .type-post, .item').each((_, el) => {
      const a = $(el).find('a').first();
      const img = $(el).find('img').first();
      
      if (!a.length) return;
      
      let title = $(el).text().trim().split('\n')[0];
      if (!title) title = a.attr('title') || a.text().trim();
      
      let urlHref = a.attr('href');
      let slug = urlHref.replace('https://pornavhd.com/', '');
      if (slug.endsWith('/')) slug = slug.slice(0, -1);
      
      let imgSrc = img.attr('src') || "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg";
      
      posts.push({
        id: slug,
        slug: slug,
        name: title,
        cover_url: imgSrc,
        poster_url: imgSrc,
        views: 0,
        tags: ["PornavHD"],
        original_url: urlHref
      });
    });
    
    return posts;
  } catch (error) {
    console.error("[ScraperAPI Search Error]", error);
    return [];
  }
};

export const scrapePornavHDVideo = async (slug) => {
  const url = `https://pornavhd.com/${slug}/`;
  try {
    const html = await fetchScraperAPI(url, true);
    const $ = cheerio.load(html);
    
    let embedUrl = null;
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('/e/') || src.includes('embed') || src.includes('video')) {
        embedUrl = src;
      }
    });
    
    const title = $('h1').first().text().trim() || "Video";
    const img = $('meta[property="og:image"]').attr('content') || "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg";
    
    return {
      embedUrl,
      title,
      coverUrl: img,
      originalUrl: url
    };
  } catch (error) {
    console.error("[ScraperAPI Video Error]", error.message);
    return { embedUrl: null, title: slug, coverUrl: "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg", originalUrl: url, error: error.message };
  }
};

export const fetchWithStealth = async (url) => {
  try {
    return await fetchScraperAPI(url, true);
  } catch (err) {
    console.error("fetchWithStealth error:", err.message);
    return "";
  }
};
