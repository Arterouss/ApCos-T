const axios = require("axios");

async function exploreDoujinDesu() {
  try {
    const { data } = await axios.get("https://doujin.desu.xxx/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
      }
    });
    console.log("HTML length:", data.length);
    console.log("Snippet:", data.substring(data.indexOf("<body"), data.indexOf("<body") + 2500));
  } catch (error) {
    console.error("Error fetching:", error.message);
  }
}
exploreDoujinDesu();
