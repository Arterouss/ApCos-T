import fetch from "node-fetch";

const SCRAPER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const DIFFERENT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const BASE_URL = "http://localhost:3001";

async function testUAMismatch() {
  try {
    console.log("1. Fetching Detail (using Scraper logic implicitly)...");
    // This endpoint uses SCRAPER_UA internally
    const latestRes = await fetch(`${BASE_URL}/api/nekopoi/latest`);
    const latest = await latestRes.json();
    const slug = latest[0].slug;

    const detailRes = await fetch(
      `${BASE_URL}/api/nekopoi/detail?slug=${slug}`,
    );
    const detail = await detailRes.json();

    if (!detail.rawVideoUrls || detail.rawVideoUrls.length === 0) {
      console.log("No raw video URLs found to test.");
      return;
    }

    const videoData = detail.rawVideoUrls[0];
    const videoUrl = videoData.url;
    const referer = videoData.referer;

    console.log(`Testing URL: ${videoUrl.substring(0, 50)}...`);
    console.log(`Referer: ${referer}`);

    // Test 1: Fetch with MATCHING UA (Simulating what works)
    console.log("\n--- Test 1: Matching UA ---");
    const res1 = await fetch(videoUrl, {
      headers: {
        "User-Agent": SCRAPER_UA,
        Referer: referer,
      },
    });
    console.log(`Status: ${res1.status}`);
    if (res1.ok) console.log("Success with matching UA");
    else console.log("Failed with matching UA");

    // Test 2: Fetch with DIFFERENT UA (Simulating Frontend/Proxy)
    console.log("\n--- Test 2: Different UA ---");
    const res2 = await fetch(videoUrl, {
      headers: {
        "User-Agent": DIFFERENT_UA,
        Referer: referer,
      },
    });
    console.log(`Status: ${res2.status}`);
    if (res2.ok) console.log("Success with different UA");
    else console.log("Failed with different UA (Confirmed Mismatch Issue)");
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testUAMismatch();
