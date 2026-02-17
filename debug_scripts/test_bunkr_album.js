import fetch from "node-fetch";
import * as cheerio from "cheerio";

// A known existing album URL (if I can find one or guess one)
// Or just try a random letters one which should at least give 404 not generic home
const ALBUM_URL = "https://bunkr.si/a/8n7d5s2k"; // Example slug

async function testAlbum() {
  try {
    console.log(`Testing Album Fetch: ${ALBUM_URL}`);
    const res = await fetch(ALBUM_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    console.log(`Album Status: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const title = $("title").text();
    console.log(`Page Title: ${title}`);

    // Check for file items
    const files = $("div.relative.group\\/item").length;
    console.log(`Found ${files} file items on album page.`);

    if (files === 0) {
      console.log("Still no files. Inspecting HTML dump...");
      // console.log(html.substring(0, 1000));
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testAlbum();
