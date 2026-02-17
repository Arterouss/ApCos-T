import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function testNekopoi() {
  try {
    console.log("1. Fetching Latest Nekopoi...");
    const latestRes = await fetch(`${BASE_URL}/api/nekopoi/latest`);
    if (!latestRes.ok) throw new Error(`Latest failed: ${latestRes.status}`);
    const latest = await latestRes.json();

    if (latest.length === 0) {
      console.log("No posts found in latest.");
      return;
    }

    const slug = latest[0].slug;
    console.log(`Found slug: ${slug}`);

    console.log(`2. Fetching Detail for ${slug}...`);
    const detailRes = await fetch(
      `${BASE_URL}/api/nekopoi/detail?slug=${slug}`,
    );
    if (!detailRes.ok) throw new Error(`Detail failed: ${detailRes.status}`);
    const detail = await detailRes.json();

    console.log("--- Detail Result ---");
    console.log("Title:", detail.title);
    console.log("Video Iframes:", detail.videoIframes?.length);
    console.log("Raw Video URLs:", detail.rawVideoUrls);

    if (detail.rawVideoUrls && detail.rawVideoUrls.length > 0) {
      console.log("SUCCESS: Raw video URLs found!");
    } else {
      console.log(
        "WARNING: No raw video URLs found (scraper implementation might need adjustment or this video has none).",
      );
    }
  } catch (error) {
    console.error("Test Failed:", error.message);
  }
}

testNekopoi();
