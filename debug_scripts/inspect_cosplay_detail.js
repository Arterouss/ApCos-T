import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function run() {
  const url = "https://cosplaytele.com/fern-16/";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log("Title:", $("h1.entry-title").text().trim());

    // Images
    const images = [];
    $(".entry-content img").each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src) images.push(src);
    });
    console.log(`Found ${images.length} images.`);

    // Download Links
    console.log("\n--- Download Links ---");
    $("a").each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr("href");
      if (
        text.includes("download") ||
        text.includes("mediafire") ||
        text.includes("gofile") ||
        text.includes("mega")
      ) {
        console.log(`[${text.trim()}] ${href}`);
      }
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
