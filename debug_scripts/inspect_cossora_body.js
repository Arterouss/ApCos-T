import fetch from "node-fetch";

const iframeUrl =
  "https://cossora.stream/embed/04f454ba-7fa2-49cb-8602-a1cf523103a0";

async function run() {
  console.log(`Fetching ${iframeUrl} with Referer...`);
  try {
    const res = await fetch(iframeUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://cosplaytele.com/",
      },
    });
    const text = await res.text();
    console.log("--- BODY START ---");
    console.log(text);
    console.log("--- BODY END ---");
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
