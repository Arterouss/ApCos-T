import axios from "axios";
import { createHash } from "crypto";

const SCRAPER_API_KEY = "4a21d9f2cfa3ccf27c74ba8aec026c43";
const IWARA_API = "https://api.iwara.tv";

const iwaraFetch = async (url, customHeaders = {}) => {
  const proxied = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(url)}&render=true&keep_headers=true`;
  const r = await axios.get(proxied, { headers: customHeaders, timeout: 25000 });
  if (typeof r.data === "string") return JSON.parse(r.data);
  return r.data;
};

async function testStream() {
  try {
    const iwaraId = "Du5QKxFtUkRthF"; // A known video ID
    console.log("Fetching info...");
    const info = await iwaraFetch(`${IWARA_API}/video/${iwaraId}`);
    console.log("Got info. fileUrl:", info?.fileUrl);

    if (!info?.fileUrl) return console.log("No fileUrl found.");

    const fileId = info.file?.id || "";
    const fullUrl = info.fileUrl.startsWith("//") ? "https:" + info.fileUrl : info.fileUrl;
    const parsedUrl = new URL(fullUrl);
    const expires = parsedUrl.searchParams.get("expires") || "";
    
    const xVersion = createHash("sha1")
      .update(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`)
      .digest("hex");

    console.log("Fetching stream URLs...");
    const sourcesData = await iwaraFetch(fullUrl, { "X-Version": xVersion, "User-Agent": "Mozilla/5.0" });
    console.log("Sources:", sourcesData);
  } catch (e) {
    console.error("Test failed:", e.message);
  }
}

testStream();
