import axios from 'axios';
import { createHash } from 'crypto';

const IWARA_API = "https://api.iwara.tv";

const iwaraFetch = async (url, customHeaders = {}) => {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.iwara.tv",
    "Referer": "https://www.iwara.tv/",
    ...customHeaders
  };
  try {
    const r = await axios.get(url, { headers, timeout: 8000 });
    return r.data;
  } catch (e) {
    if (e.response?.status !== 403) throw e;
  }
  
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const r = await axios.get(proxied, {
      headers: { "User-Agent": headers["User-Agent"], ...customHeaders },
      timeout: 9000,
    });
    if (typeof r.data === "string") return JSON.parse(r.data);
    return r.data;
  } catch (e) {
  }
  throw new Error("Iwara API unreachable");
};

async function testStream() {
  const iwaraId = "fca22a1d-5c7e-4a4e-bb6f-ef1e65e2df2c"; // Valid ID
  try {
    const info = await iwaraFetch(`${IWARA_API}/video/${iwaraId}`);
    const fileUrl = info?.fileUrl;
    console.log("fileUrl:", fileUrl);
    
    if (!fileUrl) return;

    const fileKey = fileUrl.split("/")[6] || "";
    const xVersion = createHash("sha1")
      .update(`${fileKey}_5nFp9kmbNnHdAFhaqMvt`)
      .digest("hex");

    console.log("Fetching sources with X-Version:", xVersion);
    
    // Direct without proxy:
    try {
      const res = await axios.get(`https:${fileUrl}`, {
        headers: { "X-Version": xVersion, "User-Agent": "Mozilla/5.0" },
        timeout: 7000,
      });
      console.log("Direct success! Sources:", res.data.length);
    } catch (e) {
      console.log("Direct failed:", e.message, e.response?.status);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testStream();
