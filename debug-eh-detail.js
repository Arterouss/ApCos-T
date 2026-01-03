import fetch from "node-fetch";

const EHENTAI_BASE_URL = "https://e-hentai.org";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function testScraper() {
  try {
    console.log("1. Searching via AllOrigins...");
    const targetSearch = `${EHENTAI_BASE_URL}/?f_search=naruto`;
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      targetSearch
    )}`;

    const sRes = await fetch(searchUrl); // AllOrigins doesn't need custom headers usually
    const sJson = await sRes.json();
    const sHtml = sJson.contents;

    if (!sHtml) throw new Error("AllOrigins returned empty content");

    const urlMatch = /href="https:\/\/e-hentai\.org\/g\/(\d+)\/(\w+)\/"/.exec(
      sHtml
    );

    if (!urlMatch) {
      console.error("No galleries found via AllOrigins!");
      console.log(sHtml.substring(0, 500));
      return;
    }

    const [_, id, token] = urlMatch;
    console.log(`Found Gallery: ID=${id}, Token=${token}`);

    console.log("2. Fetching Gallery Detail via AllOrigins...");
    const targetGallery = `${EHENTAI_BASE_URL}/g/${id}/${token}/?p=0`;
    const gUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      targetGallery
    )}`;

    const gRes = await fetch(gUrl);
    const gJson = await gRes.json();
    const gHtml = gJson.contents;

    // Test Image Regex
    const imgBlockRegex =
      /<div class="gdtm"[^>]*>[\s\S]*?<a href="([^"]+)"[\s\S]*?background:transparent url\(([^)]+)\)/g;
    let count = 0;
    let match;
    while ((match = imgBlockRegex.exec(gHtml)) !== null) {
      count++;
    }
    console.log(`Images Found: ${count}`);

    if (count === 0) {
      console.log("Dump snippet:", gHtml.substring(0, 500));
    }
  } catch (e) {
    console.error(e);
  }
}

testScraper();
