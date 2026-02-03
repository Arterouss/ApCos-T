import fetch from "node-fetch";

const SLUG = "92FdPm34";
const API_URL = `http://localhost:3001/api/hnime/video/${SLUG}`;

async function run() {
  try {
    // 1. Get the Video Metadata
    console.log(`Getting Metadata from ${API_URL}...`);
    const metaRes = await fetch(API_URL);
    const meta = await metaRes.json();

    console.log("iframe_url:", meta.iframe_url);

    if (!meta.iframe_url) {
      console.error("No iframe_url found!");
      return;
    }

    // 2. Check the Stream URL
    console.log(`Checking Headers for ${meta.iframe_url}...`);
    const streamRes = await fetch(meta.iframe_url, { method: "HEAD" });
    console.log(`Status: ${streamRes.status}`);
    console.log(`Content-Type: ${streamRes.headers.get("content-type")}`);
    console.log(
      `Content-Disposition: ${streamRes.headers.get("content-disposition")}`,
    );
    console.log(`Location (if redirect): ${streamRes.headers.get("location")}`);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
