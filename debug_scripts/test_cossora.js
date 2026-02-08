import fetch from "node-fetch";

const iframeUrl =
  "https://cossora.stream/embed/04f454ba-7fa2-49cb-8602-a1cf523103a0";

async function test(name, headers) {
  console.log(`\n--- Testing ${name} ---`);
  try {
    const res = await fetch(iframeUrl, { headers });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);
    console.log(`Body Preview: ${text.slice(0, 200)}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

async function run() {
  // 1. No Headers
  await test("No Headers", {});

  // 2. With Referer
  await test("With Referer", {
    Referer: "https://cosplaytele.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // 3. With fake Origin
  await test("With Origin", {
    Origin: "https://cosplaytele.com",
    Referer: "https://cosplaytele.com/",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
}

run();
