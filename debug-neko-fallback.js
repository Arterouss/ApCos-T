import fetch from "node-fetch";

const target =
  "https://nekopoi.care/hentai/joukamachi-no-dandelion-episode-1-subtitle-indonesia/";
const urlAO =
  "https://api.allorigins.win/get?url=" + encodeURIComponent(target);
const urlCP = "https://corsproxy.io/?" + encodeURIComponent(target);

async function testFallback() {
  console.log("Testing AllOrigins...");
  try {
    const res = await fetch(urlAO);
    const text = await res.text();
    console.log("[AllOrigins] Preview:", text.substring(0, 200));
    try {
      const json = JSON.parse(text);
      console.log(
        "[AllOrigins] JSON Parsed. Contents Length:",
        json.contents ? json.contents.length : 0
      );
    } catch (e) {
      console.log("[AllOrigins] Not JSON.");
    }
  } catch (e) {
    console.error(e);
  }

  console.log("\nTesting CorsProxy.io...");
  try {
    const res = await fetch(urlCP);
    const text = await res.text();
    console.log("[CorsProxy] Preview:", text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}

testFallback();
