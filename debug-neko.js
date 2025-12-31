import fetch from "node-fetch";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const REGEX =
  /<div class=(?:eropost|top)>[\s\S]*?<img[^>]+src=['"]?([^ >"']+)['"]?[\s\S]*?<h2><a[^>]+href=['"]?([^ >"']+)['"]?[^>]*>(.*?)<\/a>/gi;

async function scrape(url, label) {
  console.log(`\n--- Testing ${label}: ${url} ---`);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: "https://nekopoi.care" },
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();

    let match;
    let count = 0;
    // Reset lastIndex for gloabl regex!
    REGEX.lastIndex = 0;

    while ((match = REGEX.exec(html)) !== null) {
      count++;
      if (count <= 3)
        console.log(`[${count}] ${match[3].replace(/<[^>]+>/g, "").trim()}`);
    }
    console.log(`Total: ${count}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

const run = async () => {
  await scrape("https://nekopoi.care", "Home Page");
  await scrape("https://nekopoi.care/?s=hentai", "Search Page");
};

run();
