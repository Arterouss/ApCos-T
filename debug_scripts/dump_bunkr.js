import fetch from "node-fetch";
import fs from "fs";

const BUNKR_BASE_URL = "https://bunkr.si";

async function dumpBunkr() {
  try {
    console.log("Fetching Homepage...");
    const homeRes = await fetch(BUNKR_BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await homeRes.text();
    fs.writeFileSync("debug_scripts/bunkr_home.html", html);
    console.log("Dumped bunkr_home.html");

    console.log("Fetching Search...");
    const searchRes = await fetch(`${BUNKR_BASE_URL}/?search=test`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const searchHtml = await searchRes.text();
    fs.writeFileSync("debug_scripts/bunkr_search.html", searchHtml);
    console.log("Dumped bunkr_search.html");
  } catch (error) {
    console.error("Dump Error:", error);
  }
}

dumpBunkr();
