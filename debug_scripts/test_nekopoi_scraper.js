import fetch from "node-fetch";
import * as cheerio from "cheerio";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const fetchUrl = async (url) => {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, { agent, headers: HEADERS });
  console.log(`Status: ${res.status}`);
  return await res.text();
};

async function run() {
  try {
    // 1. Fetch Latest to get a slug
    const html = await fetchUrl("https://nekopoi.care/");
    const $ = cheerio.load(html);

    // Use the same logic as api/index.js
    let items = $(".eropost");
    if (items.length === 0) items = $("article.post");

    console.log(`Found ${items.length} items on homepage.`);

    if (items.length === 0) {
      console.log("DEBUG: Homepage HTML preview:");
      console.log(html.substring(0, 500));
      return;
    }

    const firstItem = items.eq(0);
    const titleEl = firstItem.find("h2 a").first();
    const url = titleEl.attr("href");
    const slug = url ? url.split("/").filter(Boolean).pop() : null;

    console.log(`First Post: ${titleEl.text()} | URL: ${url} | Slug: ${slug}`);

    if (!slug) {
      console.error("Could not extract slug!");
      return;
    }

    // 2. Fetch Detail
    const detailUrl = `https://nekopoi.care/${slug}/`;
    const detailHtml = await fetchUrl(detailUrl);
    const $$ = cheerio.load(detailHtml);

    const title =
      $$("h1.entry-title").text().trim() || $$("h1.title").text().trim();
    console.log(`Detail Title: ${title}`);

    // Check if blocked
    if (
      detailHtml.includes("Attention Required") ||
      detailHtml.includes("Cloudflare")
    ) {
      console.error("BLOCKED BY CLOUDFLARE");
    }
  } catch (e) {
    console.error(e);
  }
}

run();
