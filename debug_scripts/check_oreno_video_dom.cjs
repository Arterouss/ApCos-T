const axios = require("axios");
const cheerio = require("cheerio");
const https = require("https");

const sslAgent = new https.Agent({ rejectUnauthorized: false });

async function checkVideoDetails() {
  const url = "https://oreno3d.com/movies/340810";
  const r = await axios.get(url, {
    httpsAgent: sslAgent,
    headers: { "User-Agent": "Mozilla/5.0" },
    timeout: 10000
  });
  const $ = cheerio.load(r.data);
  
  console.log("=== All links with iwara or video in href or text ===");
  $("a").each((i, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (href.includes("iwara") || href.includes("video") || text.includes("再生") || text.includes("Watch")) {
      console.log(`Link: text="${text}", href="${href}", class="${$(el).attr("class")}"`);
    }
  });

  console.log("\n=== Checking classes around h1 (title) ===");
  const h1Parent = $("h1").parent();
  console.log("Parent HTML around h1:\n", h1Parent.html() ? h1Parent.html().substring(0, 800) : "no parent");

  console.log("\n=== Checking script tags for any json / video data ===");
  $("script").each((i, el) => {
    const content = $(el).html() || "";
    if (content.includes("iwara") || content.includes("video") || content.includes("mp4") || content.includes("file")) {
      console.log(`Script ${i} snippet:\n`, content.substring(0, 400));
    }
  });
}

checkVideoDetails().catch(e => console.error(e.message));
