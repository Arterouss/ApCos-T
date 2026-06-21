import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

let browserInstance = null;

export const getBrowser = async () => {
  if (!browserInstance) {
    console.log("[Puppeteer] Launching new browser instance...");
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
};

export const scrapePornavHDSearch = async (query, pageNum) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    const url = query 
      ? `https://pornavhd.com/page/${pageNum}/?s=${encodeURIComponent(query)}` 
      : `https://pornavhd.com/page/${pageNum}/`;
      
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Quick delay for any JS rendering
    await new Promise(r => setTimeout(r, 2000));
    
    const posts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('article, .post, .type-post, .item')).map(el => {
        const a = el.querySelector('a');
        const img = el.querySelector('img');
        if (!a) return null;
        
        let title = el.innerText.trim().split('\n')[0];
        if (!title && a) title = a.title || a.innerText;
        
        // Extract slug from URL: https://pornavhd.com/2026/06/14/retsu_dao_58/ -> 2026/06/14/retsu_dao_58
        let urlHref = a.href;
        let slug = urlHref.replace('https://pornavhd.com/', '');
        if (slug.endsWith('/')) slug = slug.slice(0, -1);
        
        return {
          id: slug,
          slug: slug,
          name: title,
          cover_url: img ? img.src : "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg",
          poster_url: img ? img.src : "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg",
          views: 0,
          tags: ["PornavHD"],
          original_url: urlHref
        };
      }).filter(Boolean);
    });
    
    return posts;
  } catch (error) {
    console.error("[Puppeteer Search Error]", error);
    return [];
  } finally {
    await page.close();
  }
};

export const scrapePornavHDVideo = async (slug) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    const url = `https://pornavhd.com/${slug}/`;
      
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await new Promise(r => setTimeout(r, 3000));
    
    const videoData = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      // Find the iframe that looks like a video embed
      const embedIframe = iframes.find(ifr => {
        const src = ifr.src || '';
        return src.includes('/e/') || src.includes('embed') || src.includes('video');
      });
      
      const title = document.querySelector('h1')?.innerText || "Video";
      const img = document.querySelector('meta[property="og:image"]')?.content;
      
      return {
        embedUrl: embedIframe ? embedIframe.src : null,
        title: title,
        coverUrl: img || "https://static.pornavhd.com/img/logo_PornavHD-9Kl5M1Y.svg"
      };
    });
    
    return videoData;
  } catch (error) {
    console.error("[Puppeteer Video Error]", error);
    return null;
  } finally {
    await page.close();
  }
};
