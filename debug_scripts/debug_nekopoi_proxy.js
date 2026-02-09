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
    console.log("=== 1. FETCHING LIST PAGE ===");
    const html = await fetchViaProxy("https://nekopoi.care/");
    const $ = cheerio.load(html);

    // Debug List Items
    const items = $(".eropost");
    console.log(`Found ${items.length} .eropost items`);

    if (items.length > 0) {
      const first = items.first();
      console.log("\n--- First Item HTML ---");
      console.log(first.html());

      const img = first.find("img");
      console.log("\n--- Image Attributes ---");
      console.log("src:", img.attr("src"));
      console.log("data-src:", img.attr("data-src"));
      console.log("data-lazy-src:", img.attr("data-lazy-src"));

      const link = first.find("h2 a, .title a").first();
      const detailUrl = link.attr("href");
      console.log(`\nDetail URL: ${detailUrl}`);

      if (detailUrl) {
        console.log("\n=== 2. FETCHING DETAIL PAGE ===");
        const detailHtml = await fetchViaProxy(detailUrl);
        const $$ = cheerio.load(detailHtml);

        console.log("Page Title:", $$("title").text());

        console.log("\n--- Iframes ---");
        $$("iframe").each((i, el) => {
          console.log(`[${i}] src:`, $$(el).attr("src"));
        });

        console.log("\n--- Video Tags ---");
        $$("video source").each((i, el) => {
          console.log(`[${i}] src:`, $$(el).attr("src"));
        });

        console.log("\n--- Scripts (Stream Search) ---");
        const scriptContent = $$("script").text();
        const fileMatch = /file:\s*["']([^"']+)["']/.exec(scriptContent);
        if (fileMatch) {
          console.log("Found stream in script:", fileMatch[1]);
        } else {
          console.log("No stream found in scripts.");
        }

        console.log("\n--- Stream/Download Links ---");
        $$("#stream1, #stream2, #stream3").each((i, el) => {
          console.log(`Stream Div [${i}]:`, $$(el).html());
        });
      }
    } else {
      console.log("Body HTML preview:");
      console.log($("body").html().substring(0, 500));
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
