import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const url = "https://cosplaytele.com/";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    console.log("Status:", res.status);
    fs.writeFileSync("debug_scripts/cosplay_dump.html", html);
    console.log("Dumped to debug_scripts/cosplay_dump.html");
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
