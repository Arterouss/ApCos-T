import fetch from "node-fetch";

const fetchViaProxy = async (targetUrl) => {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  // Try CodeTabs (known to work)
  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    console.log(`Fetching via CodeTabs: ${proxyUrl}`);
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) return await res.text();
    console.log(`CodeTabs failed: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  throw new Error(`Proxy failed.`);
};

async function run() {
  try {
    const url = "https://vidnest.io/embed-di28q54jfgps.html";
    const html = await fetchViaProxy(url);

    console.log("--- Vidnest HTML ---");
    console.log(html.substring(0, 1000));

    // Look for m3u8 or mp4
    const m3u8 = /["']([^"']+\.m3u8.*?)["']/.exec(html);
    if (m3u8) {
      console.log("FOUND M3U8:", m3u8[1]);
    }

    const mp4 = /["']([^"']+\.mp4.*?)["']/.exec(html);
    if (mp4) {
      console.log("FOUND MP4:", mp4[1]);
    }

    // Look for packer/obfuscation
    if (html.includes("eval(function(p,a,c,k,e,d)")) {
      console.log("FOUND PACKED JS");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
