import fetch from "node-fetch";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const QUERY = "seravin";

async function testUrl(url) {
  try {
    console.log(`Testing ${url}...`);
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      const html = await res.text();
      console.log(`Length: ${html.length}`);
      if (html.includes("seravin")) console.log("FOUND 'seravin' in response!");
      else console.log("Not found 'seravin' in text.");
    }
  } catch (e) {
    console.log("Error:", e.message);
  }
}

async function run() {
  // Try Query Param
  await testUrl(`https://bunkr-albums.io/?s=${QUERY}`);
  await testUrl(`https://bunkr-albums.io/search?q=${QUERY}`);
  await testUrl(`https://bunkr-albums.io/search/${QUERY}`); // No trailing slash
  await testUrl(`https://bunkr-albums.io/search/${QUERY}/`); // With trailing slash
}
run();
