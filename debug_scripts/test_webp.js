import fetch from "node-fetch";

// From previous logs:
// Name: Fern (1).webp
// Thumb: https://i-cheese.bunkr.ru/thumbs/aa1fd741-3228-4695-bd30-a9529558a279.png
// Derived URL (Current logic): https://i-cheese.bunkr.ru/aa1fd741-3228-4695-bd30-a9529558a279.png

const BASE_ID = "aa1fd741-3228-4695-bd30-a9529558a279";
const HOST = "https://i-cheese.bunkr.ru";

async function check(url) {
  try {
    console.log(`Checking ${url}...`);
    const res = await fetch(url, { method: "HEAD" });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      console.log(`Type: ${res.headers.get("content-type")}`);
      console.log(`Length: ${res.headers.get("content-length")}`);
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

async function run() {
  // 1. Check the derived PNG URL (what we are doing now)
  await check(`${HOST}/${BASE_ID}.png`);

  // 2. Check the WEBP URL (what if the original is kept?)
  await check(`${HOST}/${BASE_ID}.webp`);

  // 3. Check JPG just in case
  await check(`${HOST}/${BASE_ID}.jpg`);
}

run();
