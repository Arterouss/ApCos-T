import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  
  console.log("Navigating to video page...");
  await page.goto('https://pornavhd.com/2026/06/14/retsu_dao_58/', { waitUntil: 'networkidle2', timeout: 60000 });
  
  await new Promise(r => setTimeout(r, 5000));
  
  const videoData = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    return {
      dataLink: iframe ? iframe.getAttribute('data-link') : null,
      src: iframe ? iframe.src : null,
      outer: iframe ? iframe.outerHTML : null
    };
  });
  
  console.log("Extracted video data:", videoData);
  await browser.close();
}

run().catch(console.error);
