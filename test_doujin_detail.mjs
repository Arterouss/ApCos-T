import { getBrowser } from "./api/scraper.js";

async function testDetail() {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    // Test a specific manga slug found earlier
    await page.goto("https://doujin.desu.xxx/manga/tsugou-no-ii-mesu", { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    const items = await page.evaluate(() => {
       const anchors = Array.from(document.querySelectorAll("a"));
       const links = anchors.map(a => ({
         href: a.href,
         text: a.innerText.trim(),
         className: a.className,
       })).filter(a => a.href && a.href.length > 25).slice(0, 50);
       
       const imgs = Array.from(document.querySelectorAll("img")).map(img => img.src).slice(0, 5);
       
       const titles = Array.from(document.querySelectorAll("h1, h2, h3, p")).map(t => t.innerText.trim()).filter(Boolean).slice(0, 10);
       
       return { links, imgs, titles };
    });
    console.log(JSON.stringify(items, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
  }
}
testDetail();
