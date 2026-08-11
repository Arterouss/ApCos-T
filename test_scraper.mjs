import * as cheerio from "cheerio";
import fetch from "node-fetch";

const SCRAPER_API_KEY = "4a21d9f2cfa3ccf27c74ba8aec026c43";
const BASE_URL = "https://rule34video.com";

const fetchScraperAPI = async (targetUrl, useRender = false) => {
  const url = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}${useRender ? '&render=true' : ''}`;
  console.log(`[ScraperAPI] Fetching ${targetUrl} (render=${useRender})`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Status ${response.status}`);
  return response.text();
};

async function testDetail() {
  const slug = "videos/3141150/test/";
  const url = `${BASE_URL}/${slug}`;
  
  console.log("--- TEST RENDER = FALSE ---");
  let html = await fetchScraperAPI(url, false);
  let $ = cheerio.load(html);
  console.log("Title:", $('h1, h2, .title').first().text().trim());
  console.log("Video:", $('video source, video').first().attr('src'));
  console.log("Iframe:", $('iframe[src*="embed"]').first().attr('src'));

  console.log("\n--- TEST RENDER = TRUE ---");
  html = await fetchScraperAPI(url, true);
  $ = cheerio.load(html);
  console.log("Title:", $('h1, h2, .title').first().text().trim());
  console.log("Video:", $('video source, video').first().attr('src'));
  console.log("Iframe:", $('iframe[src*="embed"]').first().attr('src'));
}

testDetail().catch(console.error);
