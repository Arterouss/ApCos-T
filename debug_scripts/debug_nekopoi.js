import fetch from "node-fetch";
import * as cheerio from "cheerio";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false,
});

const TARGET_URL = "https://nekopoi.care/";

async function run() {
  console.log(`Fetching ${TARGET_URL}...`);
  try {
    // Mock a browser UA
    const response = await fetch(TARGET_URL, {
      agent,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    console.log(`Status: ${response.status}`);
    const html = await response.text();
    console.log(`Length: ${html.length}`);

    const $ = cheerio.load(html);
    const title = $("title").text();
    console.log(`Page Title: ${title}`);

    // Try to identify posts
    // Common WP classes: .post, .article, etc.
    const posts = [];
    $("#boxid .eropost").each((i, el) => {
      const title = $(el).find("h2 a").text();
      const url = $(el).find("h2 a").attr("href");
      const img = $(el).find("img").attr("src");
      if (title) posts.push({ title, url, img });
    });

    if (posts.length === 0) {
      // Try another selector if the above fail, Nekopoi changes themes often
      console.log("Debug: Dumping body classes to guess selector...");
      console.log($("body").attr("class"));
      console.log("Debug: First 500 chars of body:");
      console.log($("body").html().substring(0, 500));
    } else {
      console.log(`Found ${posts.length} posts:`);
      console.log(posts.slice(0, 3));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

run();
