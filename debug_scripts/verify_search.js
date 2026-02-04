import fetch from "node-fetch";

async function run() {
  const url = "http://localhost:3001/api/hnime/search?page=1";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Error: ${res.status}`);
      console.error(await res.text());
      return;
    }
    const data = await res.json();
    console.log("Status: OK");
    const hits = JSON.parse(data.hits);
    console.log(`Found ${hits.length} albums.`);
    if (hits.length > 0) {
      console.log("First Hit:", hits[0]);
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

run();
