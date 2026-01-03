import fetch from "node-fetch";

async function testAllOrigins() {
  try {
    console.log("Testing AllOrigins...");
    const target = "https://e-hentai.org/?f_search=naruto";
    const url = `https://api.allorigins.win/get?url=${encodeURIComponent(
      target
    )}`;

    const res = await fetch(url);
    console.log(`Status: ${res.status}`);

    const text = await res.text();
    console.log(`Raw Body Preview: ${text.substring(0, 200)}`);

    try {
      const json = JSON.parse(text);
      console.log("JSON Parse Success!");
      console.log(`Contents length: ${json.contents?.length}`);
      if (json.contents?.includes("e-hentai.org")) {
        console.log("Content seems valid!");
      } else {
        console.log("Content might be captcha/block page.");
      }
    } catch (e) {
      console.error("JSON Parse Failed:", e.message);
    }
  } catch (e) {
    console.error("Request Failed:", e);
  }
}

testAllOrigins();
