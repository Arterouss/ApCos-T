import fetch from "node-fetch";
import * as cheerio from "cheerio";

async function extractRedditLinks() {
  try {
    console.log("Searching Reddit for recent Bunkr links...");
    // Use a public JSON endpoint or just scrape HTML if possible (HTML is harder on Reddit due to hydration)
    // Actually, Reddit adds .json to URLs. Let's try searching via Reddit JSON API.

    const term = "bunkr.cr/a/";
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&limit=5`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      console.log(`Reddit Search Failed: ${res.status}`);
      return;
    }

    const data = await res.json();
    const posts = data.data?.children || [];

    const bunkrLinks = [];

    posts.forEach((post) => {
      const text = post.data.selftext || "";
      const title = post.data.title || "";
      const url = post.data.url || "";

      // Regex to find bunkr links
      const regex = /https?:\/\/(bunkr\.(?:si|cr|ph|la|sk))\/a\/[a-zA-Z0-9]+/g;

      const textMatches = text.match(regex) || [];
      const titleMatches = title.match(regex) || [];
      const urlMatches = url.match(regex) || [];

      bunkrLinks.push(...textMatches, ...titleMatches, ...urlMatches);
    });

    const uniqueLinks = [...new Set(bunkrLinks)];
    console.log(`Found ${uniqueLinks.length} unique Bunkr links.`);
    uniqueLinks.forEach((link) => console.log(link));

    // If we found a link, let's try to scrape IT.
    if (uniqueLinks.length > 0) {
      const target = uniqueLinks[0];
      console.log(`\nTesting Scraper on: ${target}`);

      const scraperRes = await fetch(target, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      console.log(`Target Status: ${scraperRes.status}`);

      if (scraperRes.ok) {
        const html = await scraperRes.text();
        const $ = cheerio.load(html);
        // Check for file grid
        const fileItems = $("div.relative.group\\/item").length; // from old scraper logic
        // Check new logic?
        const gridItems = $("div[class*='grid-images_box']").length;
        console.log(`Found ${fileItems} items (Old Logic)`);
        console.log(`Found ${gridItems} items (New Logic Guess)`);

        if (fileItems === 0 && gridItems === 0) {
          // console.log("Dump snippet:", html.substring(0, 500));
          if (html.includes("challenge"))
            console.log("Challenge Detected on Album Page");
        }
      }
    }
  } catch (error) {
    console.error("Extraction Error:", error);
  }
}

extractRedditLinks();
