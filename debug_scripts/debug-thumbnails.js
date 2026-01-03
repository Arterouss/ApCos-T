import fetch from "node-fetch";

const PROXY_CODETABS = (u) =>
  `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`;
const TARGET_URL = "https://e-hentai.org/?page=0&nw=session";

async function run() {
  console.log("--- DEBUGGING THUMBNAILS ---");
  const url = PROXY_CODETABS(TARGET_URL);
  console.log("Target URL:", TARGET_URL);
  console.log("Proxy URL:", url);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Status:", res.status);
      console.error("StatusText:", res.statusText);
      return;
    }
    const text = await res.text();
    console.log("Total HTML length:", text.length);

    if (text.includes("ExHentai.org"))
      console.log("Title: ExHentai.org detected (Sad Panda?)");
    if (text.includes("E-Hentai Galleries"))
      console.log("Title: E-Hentai Galleries detected");

    // Inspect Table rows which usually contain the galleries
    // Common classes: gl1t, gl3t, gl3c
    const glMatches = text.match(/gl[13][tc]/g);
    console.log("gl* class matches:", glMatches ? glMatches.length : 0);

    // Find Image tags inside these rows
    // Look for typical thumbnail structure
    const imgRegex = /<img[^>]+(src|data-src)="([^"]+)"/g;

    let match;
    let count = 0;
    let thumbs = [];

    // We'll scan specifically for what seems to be gallery thumbnails
    // usually inside a known structure or just generally in the page
    while ((match = imgRegex.exec(text)) !== null) {
      const src = match[2];
      // Filter out common UI elements if possible, but for now just show valid http links
      if (src.startsWith("http")) {
        thumbs.push(src);
        count++;
      }
    }

    console.log(`Total HTTP images found: ${count}`);
    if (thumbs.length > 0) {
      console.log("First 5 image sources:");
      thumbs.slice(0, 5).forEach((t) => console.log("-", t));
    }

    // Check for specific failure cases
    if (text.length < 5000) {
      console.log("\n--- SHORT CONTENT DUMP ---");
      console.log(text);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

run();
