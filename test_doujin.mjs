import { getBrowser } from "./api/scraper.js";

async function testNav() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Go to homepage and find all navigation links
  await page.goto("https://doujin.desu.xxx/", { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  // Get all nav links
  const navLinks = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return [];
    return Array.from(nav.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.innerText.trim()
    }));
  });
  console.log("Nav links:", navLinks);
  
  // Also test more URLs
  const extraUrls = [
    "https://doujin.desu.xxx/doujin",
    "https://doujin.desu.xxx/explore",
    "https://doujin.desu.xxx/latest",
    "https://doujin.desu.xxx/trending",
    "https://doujin.desu.xxx/popular",
  ];
  
  for (const url of extraUrls) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 2000));
      const title = await page.title();
      const count = await page.evaluate(() => 
        Array.from(document.querySelectorAll('a[href*="/manga/"]')).filter(a => a.querySelector('img')).length
      );
      console.log(`${url} => Title: ${title}, Items: ${count}`);
    } catch (e) {
      console.log(`${url} => ERROR: ${e.message}`);
    }
  }
  
  process.exit(0);
}
testNav();
