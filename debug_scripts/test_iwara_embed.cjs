const axios = require("axios");
const https = require("https");

const sslAgent = new https.Agent({ rejectUnauthorized: false });

async function testEmbed() {
  const iwaraId = "km8JHlMByHCi3K";
  const urls = [
    `https://www.iwara.tv/embed/${iwaraId}`,
    `https://www.iwara.tv/video/${iwaraId}/embed`,
    `https://api.iwara.tv/embed/${iwaraId}`
  ];

  for (const u of urls) {
    try {
      const r = await axios.get(u, {
        httpsAgent: sslAgent,
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 8000
      });
      console.log(`URL ${u} -> status: ${r.status}, length: ${r.data.length}`);
    } catch(e) {
      console.log(`URL ${u} -> error: ${e.message} (${e.response?.status})`);
    }
  }
}

testEmbed();
