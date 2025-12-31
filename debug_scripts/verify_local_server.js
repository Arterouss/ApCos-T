import axios from "axios";

const BASE_URL = "http://localhost:3001";

async function testEndpoints() {
  console.log("Starting server verification...");

  // 1. Test Generic Proxy Safety (SSRF)
  try {
    console.log("Test 1: SSRF Protection...");
    await axios.get(`${BASE_URL}/api/proxy?url=http://localhost:3001/secret`);
    console.error("FAIL: Restricted URL was accessed!");
  } catch (err) {
    if (err.response && err.response.status === 403) {
      console.log("PASS: Restricted URL blocked (403 Forbidden).");
    } else {
      console.error(`FAIL: Unexpected error: ${err.message}`);
    }
  }

  // 2. Test Trending Endpoint
  try {
    console.log("\nTest 2: Fetching HAnime Trending...");
    const res = await axios.get(`${BASE_URL}/api/hnime/trending`);
    if (Array.isArray(res.data) && res.data.length > 0) {
      console.log(`PASS: Fetched ${res.data.length} trending items.`);
      // console.log("Sample:", res.data[0].name);
    } else {
      console.warn("WARN: Trending returned empty array or invalid format.");
    }
  } catch (err) {
    console.error(`FAIL: Trending fetch failed: ${err.message}`);
  }

  // 3. Test Creators Endpoint
  try {
    console.log("\nTest 3: Fetching Kemono Creators...");
    const res = await axios.get(`${BASE_URL}/api/creators`);
    if (Array.isArray(res.data)) {
      console.log(`PASS: Fetched ${res.data.length} creators.`);
    } else {
      console.warn("WARN: Creators returned unexpected format.");
    }
  } catch (err) {
    console.error(`FAIL: Creators fetch failed: ${err.message}`);
    // This is expected if Kemono blocks the request, but we want to see the proxy is running.
    if (err.response) {
      console.log(`(Note: Upstream API returned ${err.response.status})`);
    }
  }
}

testEndpoints();
