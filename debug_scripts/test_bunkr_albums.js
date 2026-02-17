import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BUNKR_ALBUMS_URL = "https://bunkr-albums.io";

async function testBunkrAlbums() {
  try {
    console.log(`Testing Bunkr Albums Site: ${BUNKR_ALBUMS_URL}`);
    const res = await fetch(BUNKR_ALBUMS_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(`Status: ${res.status}`);

    if (res.ok) {
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $("title").text();
      console.log(`Page Title: ${title}`);

      // Check for album links
      const links = $("a[href*='bunkr']").length;
      console.log(`Found ${links} Bunkr links.`);

      // Try a search on this site
      console.log("\nTesting Search on Bunkr Albums...");
      const searchRes = await fetch(`${BUNKR_ALBUMS_URL}/?s=sex`, {
        // WordPress style search
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      console.log(`Search Status: ${searchRes.status}`);
      if (searchRes.ok) {
        const searchHtml = await searchRes.text();
        const $search = cheerio.load(searchHtml);
        const searchLinks = $search("a[href*='bunkr']").length;
        console.log(`Found ${searchLinks} Bunkr links in search.`);
      }
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testBunkrAlbums();
