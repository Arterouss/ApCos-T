import * as cheerio from "cheerio";
import fetch from "node-fetch";

async function run() {
  // Using a video specific URL found in dump
  const url = "https://cosplaytele.com/furina-8/";
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

    // Videos
    console.log("\n--- Videos ---");
    const videoTags = $("video");
    console.log(`Found ${videoTags.length} video tags`);
    videoTags.each((i, el) => {
      console.log(
        "Video Tag:",
        $(el).attr("src") || $(el).find("source").attr("src"),
      );
    });

    const iframes = $("iframe");
    console.log(`Found ${iframes.length} iframes`);
    iframes.each((i, el) => {
      console.log("Iframe:", $(el).attr("src"));
    });

    // Check for specific video hosts links if not embedded
    $("a").each((i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        (href.includes("youtube") ||
          href.includes("vimeo") ||
          href.includes("stream") ||
          href.includes("mp4"))
      ) {
        console.log("Video Link:", href);
      }
    });
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
