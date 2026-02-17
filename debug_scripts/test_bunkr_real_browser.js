import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BUNKR_BASE_URL = "https://bunkr.si";

async function testRealBrowser() {
  try {
    console.log("Testing Bunkr Search with Exact Browser Headers...");
    const searchUrl = `${BUNKR_BASE_URL}/?search=sex`; // Common term to ensure results

    const headers = {
      authority: "bunkr.si",
      method: "GET",
      path: "/?search=sex",
      scheme: "https",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      referer: "https://bunkr.si/", // Crucial: referer from self
      "sec-ch-ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    const searchRes = await fetch(searchUrl, { headers });
    console.log(`Search Status: ${searchRes.status}`);

    const html = await searchRes.text();
    const $ = cheerio.load(html);
    const title = $("title").text();
    console.log(`Page Title: ${title}`);

    // Check for results
    const links = $("a[href*='/a/']").length;
    console.log(`Found ${links} album links.`);

    if (links === 0) {
      // console.log(html.substring(0, 500)); // Peek content
      console.log("Still failing to find results. Analyzing response...");
      if (html.includes("cf-challenge"))
        console.log("Cloudflare Challenge Detected");
      if (html.includes("DDos-Guard")) console.log("DDoS Guard Detected");
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testRealBrowser();
