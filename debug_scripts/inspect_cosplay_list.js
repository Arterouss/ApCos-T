import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function run() {
  const url = "https://cosplaytele.com/";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    console.log("Post Items Found:", $("article").length);

    // Inspect first post
    const firstPost = $("article").first();
    console.log("\n--- First Post Structure ---");
    console.log(firstPost.html().substring(0, 500)); // Log first 500 chars

    console.log("\n--- Parsed Data ---");
    const title = firstPost.find("h2.entry-title a").text().trim();
    const link = firstPost.find("h2.entry-title a").attr("href");
    const thumb = firstPost.find("img").attr("src");

    console.log("Title:", title);
    console.log("Link:", link);
    console.log("Thumb:", thumb);
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
