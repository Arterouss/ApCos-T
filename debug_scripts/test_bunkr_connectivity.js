import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BUNKR_BASE_URL = "https://bunkr.si";
const BUNKR_ALBUM_URL = "https://bunkr.cr";

async function testBunkr() {
  try {
    console.log("1. Testing Bunkr Connectivity...");

    // Test 1: Fetch Homepage
    console.log(`Fetching Homepage: ${BUNKR_BASE_URL}`);
    const homeRes = await fetch(BUNKR_BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(`Homepage Status: ${homeRes.status}`);

    if (!homeRes.ok) {
      console.error("Homepage fetch failed. Possible domain block or change.");
    } else {
      const text = await homeRes.text();
      console.log(`Homepage Content Length: ${text.length}`);
    }

    // Test 2: Search (mock)
    console.log("\n2. Testing Search...");
    const searchUrl = `${BUNKR_BASE_URL}/?search=test`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(`Search Status: ${searchRes.status}`);
    if (searchRes.ok) {
      const html = await searchRes.text();
      const $ = cheerio.load(html);
      const links = $("a[href*='/a/']").length;
      console.log(`Found ${links} album links in search results.`);
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testBunkr();
