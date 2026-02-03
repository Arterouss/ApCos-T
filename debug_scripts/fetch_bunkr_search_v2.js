import fetch from "node-fetch";
import fs from "fs";

const URL = "https://bunkr-albums.io/?search=seravin"; // Correct pattern based on script
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function run() {
  try {
    console.log(`Fetching ${URL}...`);
    const resp = await fetch(URL, { headers: { "User-Agent": UA } });
    console.log(`Status: ${resp.status}`);
    const html = await resp.text();
    fs.writeFileSync("debug_scripts/bunkr_search_v2_dump.html", html);
    console.log("Saved to debug_scripts/bunkr_search_v2_dump.html");

    if (html.includes("seravin")) {
      console.log("Found 'seravin' in the response!");
    } else {
      console.log("Did NOT find 'seravin' in the response.");
    }

    // Check for results count
    if (html.includes("Search albums....")) {
      console.log("Page seems to be the main page / search page.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
