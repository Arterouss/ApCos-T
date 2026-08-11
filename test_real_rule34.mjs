import { scrapeRule34VideoList, scrapeRule34VideoDetail } from "./api/scraperRule34Video.js";

async function run() {
  try {
    console.log("Fetching list...");
    const { videos } = await scrapeRule34VideoList(1);
    if (videos.length === 0) return console.log("No videos found.");
    
    console.log("First video slug:", videos[0].slug);
    console.log("Original URL:", videos[0].original_url);

    console.log("\nFetching detail...");
    const detail = await scrapeRule34VideoDetail(videos[0].slug);
    console.log(detail);
  } catch(e) {
    console.error(e);
  }
}
run();
