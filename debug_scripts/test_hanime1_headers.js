import axios from "axios";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const headers = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "Sec-Ch-Ua":
    '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const TEST_URL = "https://hanime1.me/watch?v=9599";

async function testFullHeaders() {
  try {
    console.log(`Fetching ${TEST_URL} with full headers...`);
    const response = await axios.get(TEST_URL, { headers });
    console.log(`Status: ${response.status}`);
    if (response.data.includes("<video")) {
      console.log("PASS: Video tag found!");
    } else {
      console.log(
        "FAIL: No video tag. Content length: " + response.data.length
      );
    }
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) console.error("Status:", err.response.status);
  }
}

testFullHeaders();
