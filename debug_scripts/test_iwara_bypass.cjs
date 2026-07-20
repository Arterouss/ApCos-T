const axios = require("axios");
const https = require("https");

const sslAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true
});

async function testBypass() {
  const iwaraId = "km8JHlMByHCi3K";
  const url = `https://api.iwara.tv/video/${iwaraId}`;

  const headersList = [
    {
      name: "Standard Chrome 124 Headers",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
        "Origin": "https://www.iwara.tv",
        "Referer": `https://www.iwara.tv/video/${iwaraId}`,
        "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
      }
    },
    {
      name: "Mobile Safari Headers",
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Referer": `https://www.iwara.tv/`
      }
    }
  ];

  for (const item of headersList) {
    console.log(`\nTesting: ${item.name}`);
    try {
      const r = await axios.get(url, {
        httpsAgent: sslAgent,
        headers: item.headers,
        timeout: 6000
      });
      console.log("SUCCESS! Status:", r.status);
      console.log("Response data:", JSON.stringify(r.data).substring(0, 200));
    } catch (e) {
      console.log("Failed:", e.message, e.response?.status);
    }
  }
}

testBypass();
