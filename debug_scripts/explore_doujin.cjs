const axios = require("axios");
const cheerio = require("cheerio");

async function exploreDoujinDesu() {
  try {
    console.log("Fetching https://doujin.desu.xxx/ ...");
    const { data } = await axios.get("https://doujin.desu.xxx/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    
    console.log("Title:", $("title").text());
    
    // Check trending / latest elements
    const elements = $(".feed .entries .entry").slice(0, 3).map((i, el) => {
      return {
        title: $(el).find(".title").text().trim() || $(el).find("a").attr("title"),
        href: $(el).find("a").attr("href"),
        type: $(el).find(".type").text().trim(),
        img: $(el).find("img").attr("src")
      };
    }).get();
    
    console.log("Sample entries found:", elements);
    console.log("HTML Snippet (first 1000 chars):", data.substring(0, 1000));
    
  } catch (error) {
    console.error("Error fetching:", error.message);
  }
}
exploreDoujinDesu();
