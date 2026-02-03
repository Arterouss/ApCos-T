import fetch from "node-fetch";

const URL = "https://bunkr.cr/f/RTPUjSDgrQJio"; // The file page for "Fern 3.mp4"

async function run() {
  try {
    console.log(`Fetching ${URL}...`);
    const res = await fetch(URL);
    const text = await res.text();
    console.log("Body Length:", text.length);
    // Log the first 5000 chars to find video tags or buttons
    console.log(text);
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
