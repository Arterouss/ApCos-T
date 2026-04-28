import axios from 'axios';
import { createHash } from 'crypto';

const IWARA_API = "https://api.iwara.tv";

const iwaraFetch = async (url, customHeaders = {}) => {
  const IWARA_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://www.iwara.tv",
    "Referer": "https://www.iwara.tv/",
    "Connection": "keep-alive",
    ...customHeaders
  };
  try {
    const r = await axios.get(url, { headers: IWARA_HEADERS, timeout: 8000 });
    return r.data;
  } catch (e) {
    if (e.response?.status !== 403) throw e;
    console.warn("[Iwara] 403 direct, trying allorigins proxy...");
  }
  
  // Try 2: route through allorigins
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const r = await axios.get(proxied, {
      headers: { "User-Agent": IWARA_HEADERS["User-Agent"], ...customHeaders },
      timeout: 9000,
    });
    if (typeof r.data === "string") return JSON.parse(r.data);
    return r.data;
  } catch (e) {
    console.warn("[Iwara] allorigins failed:", e.message);
  }
  throw new Error("Iwara API unreachable (403 from all sources)");
};

async function testStream() {
  try {
    console.log("Fetching latest videos...");
    const data = await iwaraFetch(`${IWARA_API}/videos?page=0&limit=1&sort=date`);
    const iwaraId = data?.results?.[0]?.id;
    if (!iwaraId) {
        console.log("No videos found.");
        return;
    }

    console.log(`[Iwara Stream] Fetching for: ${iwaraId}`);
    const info = await iwaraFetch(`${IWARA_API}/video/${iwaraId}`);
    const fileUrl = info?.fileUrl;
    console.log("fileUrl:", fileUrl);
    if (!fileUrl) {
      console.log("No fileUrl found");
      return;
    }

    const fileKey = fileUrl.split("/")[6] || "";
    const xVersion = createHash("sha1")
      .update(`${fileKey}_5nFp9kmbNnHdAFhaqMvt`)
      .digest("hex");

    console.log("Fetching sources with X-Version:", xVersion);
    const sourcesRes = await axios.get(`https:${fileUrl}`, {
      headers: { "X-Version": xVersion, "User-Agent": "Mozilla/5.0" },
      timeout: 7000,
    });

    console.log("Sources:", sourcesRes.data);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) {
      console.error("Status:", err.response.status);
    }
  }
}

testStream();
