import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const targetUrl = "https://pornavhd.com/";
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    const text = await res.text();
    fs.writeFileSync("pornavhd_com_dump.html", text);
    console.log("Saved to pornavhd_com_dump.html");
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
run();
