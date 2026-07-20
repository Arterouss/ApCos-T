const axios = require("axios");
const https = require("https");

const sslAgent = new https.Agent({ 
  rejectUnauthorized: false,
  ciphers: "DEFAULT:@SECLEVEL=0"
});

async function testIwaraDirect() {
  const url = "https://api.iwara.tv/video/km8JHlMByHCi3K";
  console.log("Testing:", url);
  try {
    const r = await axios.get(url, {
      httpsAgent: sslAgent,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
        "Origin": "https://www.iwara.tv",
        "Referer": "https://www.iwara.tv/"
      },
      timeout: 10000
    });
    console.log("Success Status:", r.status);
    console.log("Data fileUrl:", r.data?.fileUrl);
  } catch(e) {
    console.log("Error:", e.message);
    if (e.response) {
      console.log("Status:", e.response.status);
      console.log("Headers:", e.response.headers);
      console.log("Body snippet:", typeof e.response.data === "string" ? e.response.data.substring(0, 300) : e.response.data);
    }
  }
}

testIwaraDirect();
