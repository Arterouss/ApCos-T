import fetch from "node-fetch";
import * as cheerio from "cheerio";

const PornavHD_ALBUMS_URL = "https://PornavHD-albums.io";

async function testPornavHDAlbums() {
  try {
    console.log(`Testing PornavHD Albums Site: ${PornavHD_ALBUMS_URL}`);
    const res = await fetch(PornavHD_ALBUMS_URL, {
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
      const links = $("a[href*='PornavHD']").length;
      console.log(`Found ${links} PornavHD links.`);

      // Try a search on this site
      console.log("\nTesting Search on PornavHD Albums...");
      const searchRes = await fetch(`${PornavHD_ALBUMS_URL}/?s=sex`, {
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
        const searchLinks = $search("a[href*='PornavHD']").length;
        console.log(`Found ${searchLinks} PornavHD links in search.`);
      }
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testPornavHDAlbums();
