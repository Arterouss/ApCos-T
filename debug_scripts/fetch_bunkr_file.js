import fetch from "node-fetch";
import fs from "fs";

// Example file link from the album dump
const FILE_URL = "https://bunkr.cr/f/PPOse086Fqx4j";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function run() {
  try {
    console.log(`Fetching ${FILE_URL}...`);
    const resp = await fetch(FILE_URL, {
      headers: { "User-Agent": UA },
    });

    console.log(`Status: ${resp.status}`);
    const html = await resp.text();
    fs.writeFileSync("debug_scripts/bunkr_file_dump.html", html);
    console.log("Saved to debug_scripts/bunkr_file_dump.html");
    console.log("Total length:", html.length);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
