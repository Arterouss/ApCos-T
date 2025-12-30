import fetch from "node-fetch";

const PROXY_URL = "http://localhost:3001/api/hnime/video/itadaki-seieki";

async function testProxy() {
  try {
    console.log(`Fetching from ${PROXY_URL}...`);
    const response = await fetch(PROXY_URL);

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const text = await response.text();
      console.error("Error Body:", text);
      return;
    }

    const data = await response.json();
    console.log("Video found:", data.name);
    // console.log("Sources:", data.sources);
  } catch (error) {
    console.error("Fetch failed:", error.message);
  }
}

testProxy();
