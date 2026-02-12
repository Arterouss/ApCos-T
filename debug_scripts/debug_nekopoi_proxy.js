import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Mimic the backend's fetchWithFallback logic
const fetchViaProxy = async (targetUrl) => {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // 1. CorsProxy.io
  try {
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    console.log(`[1] Fetching via CorsProxy: ${proxyUrl}`);
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) return await res.text();
    console.log(`[1] CorsProxy failed: ${res.status}`);
  } catch (e) {
    console.log(`[1] Error: ${e.message}`);
  }

  // 2. CodeTabs
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    console.log(`[2] Fetching via CodeTabs: ${proxyUrl}`);
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) return await res.text();
    console.log(`[2] CodeTabs failed: ${res.status}`);
  } catch (e) {
    console.log(`[2] Error: ${e.message}`);
  }

  // 3. AllOrigins (JSON)
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
    console.log(`[3] Fetching via AllOrigins: ${proxyUrl}`);
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.contents) return data.contents;
    }
    console.log(`[3] AllOrigins failed: ${res.status}`);
  } catch (e) {
    console.log(`[3] Error: ${e.message}`);
  }

  throw new Error(`All proxies failed.`);
};

async function run() {
  try {
    const detailUrl =
      "https://nekopoi.care/uncensored-ichigo-aika-zatsu-de-namaiki-na-imouto-to-warikirenai-ani-episode-6-subtitle-indonesia/";
    console.log(`=== FETCHING DETAIL PAGE: ${detailUrl} ===`);

    const html = await fetchViaProxy(detailUrl);
    if (!html) {
      console.log("Failed to fetch HTML");
      return;
    }

    const $ = cheerio.load(html);
    console.log("Page Title:", $("title").text());

    console.log("\n--- IFRAMES FOUND ---");
    $("iframe").each((i, el) => {
      console.log(`[${i + 1}] ${$(el).attr("src")}`);
    });

    console.log("\n--- VIDEO TAGS ---");
    $("video source").each((i, el) => {
      console.log(`[${i + 1}] ${$(el).attr("src")}`);
    });

    console.log("\n--- STREAM TABS ---");
    $(".stream-tab, .tab-content").each((i, el) => {
      console.log(
        `[${i + 1}] Tab Content: ${$(el).text().substring(0, 50)}...`,
      );
    });
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
