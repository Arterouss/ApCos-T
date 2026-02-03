import fetch from "node-fetch";
import fs from "fs";

const SEARCH_QUERY = "seravin";
const BASE_URL = "https://bunkr-albums.io";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function run() {
  const url = `${BASE_URL}/search/${SEARCH_QUERY}/`; // Try without page/1 first, or check redirection
  console.log(`Fetching ${url}...`);

  try {
    const resp = await fetch(url, { headers: { "User-Agent": UA } });
    console.log(`Status: ${resp.status}`);
    const html = await resp.text();
    fs.writeFileSync("debug_scripts/bunkr_search_dump.html", html);
    console.log("Saved to debug_scripts/bunkr_search_dump.html");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
