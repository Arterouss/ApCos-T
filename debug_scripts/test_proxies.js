import fetch from "node-fetch";

async function testProxies() {
  const targetUrl = "https://pornavhd.com/";
  console.log("Testing AllOrigins...");
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    console.log("AllOrigins status:", res.status);
    const text = await res.text();
    console.log("AllOrigins length:", text.length);
    console.log("AllOrigins preview:", text.substring(0, 500));
  } catch(e) {
    console.error("AllOrigins failed:", e.message);
  }

  console.log("\nTesting CorsProxy...");
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
    console.log("CorsProxy status:", res.status);
    const text = await res.text();
    console.log("CorsProxy length:", text.length);
    console.log("CorsProxy preview:", text.substring(0, 500));
  } catch(e) {
    console.error("CorsProxy failed:", e.message);
  }
}

testProxies();
