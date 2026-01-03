import fetch from "node-fetch";

const IMG_URL = "https://ehgt.org/g/logo/5.png"; // Public safe static asset for testing, or use one found in scan
// Using a generic asset to test hotlinking/blocking
// Or better, let's use a real thumb found in the previous run if possible, but that expires.
// Let's use the one from the log, with hope: "https://ehgt.org/w/02/033/46631-3koqt8t5.webp"
// If that fails due to expiry on EH side, we might get 404.
// Let's try to extract one from main page first to be sure.

const PROXIES = [
  {
    name: "CorsProxy",
    url: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  },
  { name: "Wsrv", url: (u) => `https://wsrv.nl/?url=${encodeURIComponent(u)}` },
  {
    name: "CodeTabs",
    url: (u) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  },
];

async function run() {
  console.log("--- DEBUGGING IMAGE PROXIES ---");

  // First, get a fresh image URL from the page to ensure it's valid
  const listUrl =
    "https://api.codetabs.com/v1/proxy?quest=" +
    encodeURIComponent("https://e-hentai.org/?page=0&nw=session");
  let testImg = "https://ehgt.org/g/logo/logo.png"; // fallback

  try {
    const listRes = await fetch(listUrl);
    const listText = await listRes.text();
    const match = /https:\/\/ehgt\.org\/[^"'\s)]+\.webp/.exec(listText);
    // EH thumbnails are usually jpg or webp
    if (match) {
      testImg = match[0];
      console.log("Found fresh test image:", testImg);
    } else {
      console.log("Could not find fresh .webp, using fallback:", testImg);
    }
  } catch (e) {
    console.log("Failed to fetch list, using fallback:", testImg);
  }

  console.log(`Testing Image: ${testImg}`);

  for (const p of PROXIES) {
    const u = p.url(testImg);
    console.log(`\nTesting ${p.name}...`);
    console.log(`URL: ${u}`);
    try {
      const res = await fetch(u);
      console.log(`Status: ${res.status} ${res.statusText}`);
      const type = res.headers.get("content-type");
      console.log(`Content-Type: ${type}`);
      const blob = await res.arrayBuffer();
      console.log(`Size: ${blob.byteLength} bytes`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

run();
