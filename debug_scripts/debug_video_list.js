import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001/api/cosplay/videos";

async function run() {
  try {
    console.log(`Fetching ${BASE_URL}...`);
    const res = await fetch(BASE_URL);
    const posts = await res.json();

    console.log(`Found ${posts.length} posts.`);

    posts.forEach((p, i) => {
      console.log(`[${i}] Slug: ${p.slug} | URL: ${p.url}`);

      // Verify if slug reconstruction matches URL
      const reconstructed = `https://cosplaytele.com/${p.slug}/`;
      if (p.url !== reconstructed) {
        console.log(`    >>> MISMATCH! Reconstructed: ${reconstructed}`);
      }
    });
  } catch (e) {
    console.error(e);
  }
}

run();
