import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';

puppeteer.use(StealthPlugin());

async function run() {
  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Try to bypass Cloudflare
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  console.log("Navigating to pornavhd.com...");
  await page.goto('https://pornavhd.com/', { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log("Waiting for cloudflare to pass...");
  await new Promise(r => setTimeout(r, 10000));
  
  const html = await page.content();
  fs.writeFileSync('pornavhd_puppeteer.html', html);
  console.log("Saved HTML to pornavhd_puppeteer.html, length:", html.length);
  
  const posts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('article, .post, .type-post, .item')).slice(0, 5).map(el => {
      const a = el.querySelector('a');
      const img = el.querySelector('img');
      return {
        title: el.innerText.substring(0, 50).replace(/\n/g, ' '),
        url: a ? a.href : null,
        img: img ? img.src : null
      };
    });
  });
  
  console.log("Extracted posts:", posts);
  await browser.close();
}

run().catch(console.error);
