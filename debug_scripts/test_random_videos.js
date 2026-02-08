import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function run() {
  // 1. Get Videos
  const res = await fetch(`${BASE_URL}/api/cosplay/videos`);
  const posts = await res.json();

  console.log(`Testing first 10 of ${posts.length} posts...`);

  for (const post of posts.slice(0, 10)) {
    console.log(`\nTesting ${post.slug}...`);
    try {
      const detailRes = await fetch(
        `${BASE_URL}/api/cosplay/detail?slug=${post.slug}`,
      );
      if (!detailRes.ok) {
        console.error(`FAILED: ${detailRes.status}`);
        continue;
      }
      const detail = await detailRes.json();
      if (!detail.title) {
        console.error("FAILED: Missing Title");
      } else {
        console.log(
          `SUCCESS: "${detail.title.slice(0, 30)}..." | Video: ${!!detail.videoIframe}`,
        );
        if (!detail.videoIframe)
          console.warn("WARNING: No video iframe found!");
      }
    } catch (e) {
      console.error(`ERROR: ${e.message}`);
    }
  }
}

run();
