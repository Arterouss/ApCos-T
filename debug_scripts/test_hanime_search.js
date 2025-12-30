import fetch from "node-fetch";

const HANIME_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://hanime.tv/",
  Origin: "https://hanime.tv",
  "Content-Type": "application/json",
};

async function testSearch(query) {
  const url = "https://search.htv-services.com/";
  const payload = {
    search_text: query,
    tags: [],
    tags_mode: "AND",
    brands: [],
    blacklist: [],
    order_by: "created_at_unix",
    ordering: "desc",
    page: 0,
  };

  try {
    console.log(`Searching for: ${query} at ${url}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: HANIME_HEADERS,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Search failed: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error("Response:", text);
      return;
    }

    const data = await response.json();
    // Check structure
    const hits = data.hits; // Algolia often uses "hits", but this is custom.
    const videos =
      typeof hits === "string" ? JSON.parse(hits) : hits || data.hentai_videos;

    console.log("Response Data Keys:", Object.keys(data));

    if (videos) {
      console.log(`Found results (maybe).`);
      console.log(JSON.stringify(videos).substring(0, 200));
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testSearch("");
