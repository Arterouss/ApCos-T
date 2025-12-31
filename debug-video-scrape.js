import fetch from "node-fetch";
import fs from "fs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const URL = "https://nekopoi.care/ucen-lagi-main-warnet-diganggu-kakak-mesum/";

const run = async () => {
  console.log(`Fetching ${URL}...`);
  try {
    const res = await fetch(URL, {
      headers: { "User-Agent": UA, Referer: "https://nekopoi.care" },
    });
    console.log(`Status: ${res.status}`);
    const html = await res.text();

    fs.writeFileSync("video-dump.html", html);
    console.log("Saved to video-dump.html");

    // Test Iframe Regex
    // Current Regex in proxy-server lines 169-ish
    // const iframeRegex = /<div class="liner">[\s\S]*?<iframe[^>]+src="([^"]+)"/i;
    // Or generic iframe search

    console.log("--- Regex Test ---");
    const iframeRegex = /<iframe[^>]+src=['"]?([^ >"']+)['"]?/gi;
    let match;
    while ((match = iframeRegex.exec(html)) !== null) {
      console.log(`Found Iframe: ${match[1]}`);
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
};

run();
