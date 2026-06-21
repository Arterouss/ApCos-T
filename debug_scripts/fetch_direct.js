import https from "https";
import fetch from "node-fetch";
import fs from "fs";

async function fetchDirect() {
  const ip = "104.26.7.102";
  const host = "pornavhd.com";
  const url = `https://${ip}/`;

  const agent = new https.Agent({
    servername: host, // SNI
    rejectUnauthorized: false
  });

  try {
    const res = await fetch(url, {
      agent,
      headers: {
        "Host": host,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    console.log("Status:", res.status);
    const text = await res.text();
    fs.writeFileSync("pornavhd_direct.html", text);
    console.log("Saved to pornavhd_direct.html. Length:", text.length);
  } catch (e) {
    console.error("Direct fetch failed:", e.message);
  }
}

fetchDirect();
