import fetch from "node-fetch";

async function verify() {
  try {
    const url = "http://localhost:3001/api/hnime/search?q=seravin";
    console.log("Fetching:", url);
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Status:", res.status);
      const text = await res.text();
      console.error("Body:", text);
      return;
    }
    const data = await res.json();
    let hits = data.hits;
    if (typeof hits === "string") {
      hits = JSON.parse(hits);
    }

    console.log("Hits found:", hits.length);
    if (hits.length > 0) {
      console.log("First hit:", hits[0]);
    } else {
      console.warn("No hits found. Scraper might be failing.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

verify();
