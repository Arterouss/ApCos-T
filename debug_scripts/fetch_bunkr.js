import fetch from "node-fetch";
import fs from "fs";

const BUNKR_BASE_URL = "https://bunkr-albums.io";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function run() {
  try {
    console.log(`Fetching ${BUNKR_BASE_URL}...`);
    const resp = await fetch(BUNKR_BASE_URL, {
      headers: { "User-Agent": UA },
    });

    console.log(`Status: ${resp.status}`);
    const html = await resp.text();
    fs.writeFileSync("debug_scripts/bunkr_dump.html", html);
    console.log("Saved to debug_scripts/bunkr_dump.html");
    console.log("Total length:", html.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
