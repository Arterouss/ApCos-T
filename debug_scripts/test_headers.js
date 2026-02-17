import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function testHeaders() {
  try {
    console.log("1. Fetching Detail to get valid URL...");
    const latestRes = await fetch(`${BASE_URL}/api/nekopoi/latest`);
    const latest = await latestRes.json();
    const slug = latest[0].slug;

    const detailRes = await fetch(
      `${BASE_URL}/api/nekopoi/detail?slug=${slug}`,
    );
    const detail = await detailRes.json();

    if (!detail.rawVideoUrls || detail.rawVideoUrls.length === 0) {
      console.log("No raw video URLs found.");
      return;
    }

    const { url, referer } = detail.rawVideoUrls[0];
    const origin = new URL(referer).origin;

    console.log(`Testing URL: ${url.substring(0, 50)}...`);

    // Test 1: Referer ONLY (Should work)
    console.log("\n--- Test 1: Referer Only ---");
    const res1 = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
      },
    });
    console.log(`Status: ${res1.status}`);

    // Test 2: Referer + Origin (Proxy behavior)
    console.log("\n--- Test 2: Referer + Origin ---");
    const res2 = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: referer,
        Origin: origin,
      },
    });
    console.log(`Status: ${res2.status}`);

    if (res1.ok && !res2.ok) {
      console.log("CONCLUSION: Sending Origin header BREAKS the request!");
    } else {
      console.log("CONCLUSION: Origin header does not seem to affect it.");
    }
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testHeaders();
