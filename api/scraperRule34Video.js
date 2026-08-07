import { getBrowser } from "./scraper.js";

const BASE_URL = "https://rule34video.com";

export const scrapeRule34VideoList = async (page = 1, searchQuery = "") => {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();
  
  let url = `${BASE_URL}/latest-updates/${page}/`;
  if (searchQuery) {
    url = `${BASE_URL}/search/${encodeURIComponent(searchQuery)}/${page}/`;
  }

  try {
    await pageInstance.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log(`[Rule34Video Scraper] Navigating to ${url}`);
    
    await pageInstance.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    
    // Check if Cloudflare is blocking
    const isCloudflare = await pageInstance.evaluate(() => {
      return document.title.includes('Just a moment') || document.body.innerHTML.includes('cf-browser-verification');
    });

    if (isCloudflare) {
      console.log(`[Rule34Video Scraper] Cloudflare detected, waiting...`);
      await new Promise(r => setTimeout(r, 6000));
    }

    const data = await pageInstance.evaluate(() => {
      // rule34video.com usually uses .thumb for videos
      const items = Array.from(document.querySelectorAll('.thumb, .item'));
      
      const videos = items.map(el => {
        const link = el.querySelector('a');
        const img = el.querySelector('img');
        const title = el.querySelector('.title, .name');
        const duration = el.querySelector('.duration');
        
        let href = link ? link.href : null;
        let imgSrc = img ? (img.getAttribute('data-src') || img.src) : null;
        let titleText = title ? title.innerText.trim() : (link ? link.title || img?.alt : "Unknown Title");
        let durationText = duration ? duration.innerText.trim() : "";

        if (href && href.includes('/videos/')) {
            const urlObj = new URL(href);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const slug = pathParts.join('/'); // "videos/id/title"
            
            return {
                id: slug,
                title: titleText,
                image_url: imgSrc,
                duration: durationText,
                slug: slug,
                original_url: href
            };
        }
        return null;
      }).filter(Boolean);
      
      const nextBtn = document.querySelector('.pagination .next, a[data-parameters*="from_videos"]');
      const hasMore = !!nextBtn || videos.length >= 20;

      return { videos, hasMore };
    });
    
    return data;
  } catch (error) {
    console.error("[Rule34Video Scraper Error]", error.message);
    throw error;
  } finally {
    await pageInstance.close();
  }
};

export const scrapeRule34VideoDetail = async (slug) => {
  const browser = await getBrowser();
  const pageInstance = await browser.newPage();
  
  const url = slug.includes('rule34video.com') ? slug : `${BASE_URL}/${slug}`;

  try {
    await pageInstance.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    console.log(`[Rule34Video Scraper] Navigating Detail to ${url}`);
    
    await pageInstance.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    
    const data = await pageInstance.evaluate(() => {
      const titleEl = document.querySelector('h1, h2, .title');
      const title = titleEl ? titleEl.innerText.trim() : "Unknown Video";
      
      // Look for video element or iframe
      const videoEl = document.querySelector('video source, video');
      let videoUrl = videoEl ? (videoEl.src || videoEl.getAttribute('src')) : null;
      
      const iframeEl = document.querySelector('iframe[src*="embed"], iframe');
      let iframeUrl = iframeEl ? iframeEl.src : null;
      
      const tagEls = Array.from(document.querySelectorAll('.tag, .categories a, .tags a, a[href*="/tags/"]'));
      const tags = tagEls.map(t => t.innerText.trim()).filter(Boolean);
      
      return {
        title,
        video_url: videoUrl,
        iframe_url: iframeUrl,
        tags
      };
    });
    
    return { ...data, original_url: url };
  } catch (error) {
    console.error("[Rule34Video Scraper Detail Error]", error.message);
    throw error;
  } finally {
    await pageInstance.close();
  }
};
