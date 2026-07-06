import fetch from 'node-fetch';
import dns from 'dns';

try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {}

async function testEmbedReferer() {
  const embedUrl = "https://javclan.com/e/k2akufayg3fp";
  
  console.log("1. Testing with Referer: http://localhost:5173/");
  try {
    const res1 = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "http://localhost:5173/"
      }
    });
    const text1 = await res1.text();
    console.log("Status 1:", res1.status, "Contains restricted?", text1.includes("restricted") || text1.includes("Restricted"));
  } catch(e) { console.error(e.message); }

  console.log("2. Testing without Referer (no-referrer)");
  try {
    const res2 = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });
    const text2 = await res2.text();
    console.log("Status 2:", res2.status, "Contains restricted?", text2.includes("restricted") || text2.includes("Restricted"));
  } catch(e) { console.error(e.message); }

  console.log("3. Testing with Referer: https://jav.guru/");
  try {
    const res3 = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://jav.guru/"
      }
    });
    const text3 = await res3.text();
    console.log("Status 3:", res3.status, "Contains restricted?", text3.includes("restricted") || text3.includes("Restricted"));
  } catch(e) { console.error(e.message); }
}

testEmbedReferer();
