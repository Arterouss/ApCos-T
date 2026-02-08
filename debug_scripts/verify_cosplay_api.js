import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function testEndpoint(name, url) {
  console.log(`\n--- Testing ${name} ---`);
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      console.log(`Success! Got ${data.length} items.`);
      if (data.length > 0) console.log("First Item:", data[0]);
      return data[0];
    } else {
      console.log("Success! Got object.");
      console.log("Title:", data.title);
      console.log("Images:", data.images?.length);
      console.log("Downloads:", data.downloadLinks);
      return data;
    }
  } catch (e) {
    console.error("Failed:", e.message);
    return null;
  }
}

async function run() {
  // 1. Latest
  const latest = await testEndpoint("Latest", `${BASE_URL}/api/cosplay/latest`);

  // 2. Search
  await testEndpoint("Search", `${BASE_URL}/api/cosplay/search?q=fern`);

  // 3. Detail (if latest found)
  if (latest && latest.slug) {
    await testEndpoint(
      "Detail",
      `${BASE_URL}/api/cosplay/detail?slug=${latest.slug}`,
    );
  }
}

run();
