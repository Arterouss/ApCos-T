import fetch from "node-fetch";

async function testSi() {
  const targetUrl = "https://pornavhd.si/";
  try {
    const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    console.log("AllOrigins SI status:", res.status);
    const text = await res.text();
    console.log("Length:", text.length);
    console.log(text.substring(0, 300));
  } catch(e) {
    console.error("Failed:", e.message);
  }
}
testSi();
