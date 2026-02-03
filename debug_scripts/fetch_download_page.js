import fetch from "node-fetch";

const URL = "https://get.bunkrr.su/file/51130424"; // The URL we thought was direct

async function run() {
  try {
    console.log(`Fetching ${URL}...`);
    const res = await fetch(URL);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log("Body Preview:", text.substring(0, 2000));
  } catch (e) {
    console.error("Error:", e);
  }
}

run();
