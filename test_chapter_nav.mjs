import { getBrowser } from "./api/scraper.js";

async function testChapter() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // A known chapter URL (I need to get one from the previous list or just guess one)
  // Let's use the search from earlier to get a chapter URL, or just use the one we saw in test_doujin_detail:
  // href: 'https://doujin.desu.xxx/reader/892aa399-906d-486f-9224-33a1ce82f9a2'
  const url = "https://doujin.desu.xxx/reader/892aa399-906d-486f-9224-33a1ce82f9a2";
  
  try {
    console.log(`\n=== Testing Chapter: ${url} ===`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 6000));
    
    const pageData = await page.evaluate(() => {
      // Look for all anchor tags with /reader/
      const links = Array.from(document.querySelectorAll('a[href*="/reader/"]')).map(a => ({
        href: a.href,
        text: a.innerText.trim(),
        className: a.className
      }));
      return { links };
    });
    console.log("Page Data:", JSON.stringify(pageData, null, 2));
    
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
  
  process.exit(0);
}
testChapter();
