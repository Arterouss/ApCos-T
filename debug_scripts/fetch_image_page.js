import fetch from "node-fetch";

// Slug for "Fern (22).png" found in previous dump
const SLUG = "LkQgzncMZv7tJ";
const URL = `https://bunkr.cr/f/${SLUG}`;

async function run() {
  try {
    console.log(`Fetching ${URL}...`);
    const res = await fetch(URL);
    const text = await res.text();

    // Look for image tags
    console.log("--- Image Tags ---");
    const imgMatches = text.match(/<img[^>]+src="([^"]+)"/g);
    if (imgMatches) {
      imgMatches.forEach((m) => console.log(m));
    }

    // Look for Download button
    console.log("\n--- Download Link ---");
    const downloadMatch = /class="btn btn-main[^"]*" href="([^"]+)"/.exec(text);
    if (downloadMatch) {
      console.log("Download URL:", downloadMatch[1]);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
