import { getBrowser } from './api/scraper.js';

async function testRule34Video() {
  console.log("Launching browser via getBrowser...");
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to https://rule34video.com/");
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    await page.goto("https://rule34video.com/", { waitUntil: 'domcontentloaded', timeout: 45000 });
    
    // Check if cloudflare challenge exists
    await new Promise(r => setTimeout(r, 5000));
    
    const html = await page.evaluate(() => {
      return document.body.innerHTML;
    });
    console.log("HTML:", html.substring(0, 1000));
    const title = await page.title();
    console.log("Title:", title);
    
  } catch (error) {
    console.error("Error scraping rule34video.com:", error.message);
  } finally {
    await browser.close();
  }
}

testRule34Video();
