import axios from "axios";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TARGET_URL = "https://hanime1.me/watch?v=9599"; // Example video ID
const TEST_URL = "https://corsproxy.io/?" + encodeURIComponent(TARGET_URL);

async function testHanime1() {
  try {
    console.log(`Fetching ${TEST_URL}...`);
    const response = await axios.get(TEST_URL, {
      headers: {
        "User-Agent": UA,
        // Referer might be stripped or replaced by proxy, but let's try
      },
    });

    console.log(`Status: ${response.status}`);
    const html = response.data;

    // Check for video tag or source
    if (html.includes("<video")) {
      console.log("PASS: Found <video> tag");

      // Extract src
      const match = html.match(/<video[^>]+src="([^"]+)"/);
      if (match) {
        console.log("Video URL:", match[1]);
      } else {
        // Sometimes it's in a source tag
        const sourceMatch = html.match(/<source[^>]+src="([^"]+)"/);
        if (sourceMatch) {
          console.log("Source URL:", sourceMatch[1]);
        } else {
          console.log("Could not extract src attribute.");
        }
      }
    } else {
      console.log(
        "FAIL: No <video> tag found. Likely Cloudflare challenge or layout change."
      );
      // console.log("Partial HTML:", html.substring(0, 500));
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
    }
  }
}

testHanime1();
