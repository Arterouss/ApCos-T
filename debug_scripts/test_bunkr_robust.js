import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BUNKR_BASE_URL = "https://bunkr.si";

async function testBunkrRobust() {
  try {
    console.log("Testing Bunkr Search with Robust Headers...");
    const searchUrl = `${BUNKR_BASE_URL}/?search=test`;

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "max-age=0",
      "Sec-Ch-Ua":
        '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
    };

    const searchRes = await fetch(searchUrl, { headers });
    console.log(`Search Status: ${searchRes.status}`);

    const html = await searchRes.text();
    // Check for specific indicator of success (e.g., result items)
    // Based on previous code, results are in div.relative.group/item
    // But let's just check length and title first
    const $ = cheerio.load(html);
    const title = $("title").text();
    console.log(`Page Title: ${title}`);

    // Check if we hit the validation/challenge page
    if (html.includes("Just a moment") || title.includes("Cloudflare")) {
      console.log("Blocking Detected: Cloudflare Interstitial");
    } else {
      console.log(`Content Length: ${html.length}`);
      const links = $("a[href*='/a/']").length;
      const files = $("div.relative.group\\/item").length;
      console.log(`Found ${links} album links.`);
      console.log(`Found ${files} file items.`);
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testBunkrRobust();
