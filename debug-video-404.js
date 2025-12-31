import fetch from "node-fetch";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function testUrl(url) {
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://nekopoi.care",
      },
    });
    console.log(`Final Status: ${res.status}`);
    console.log(`Final URL: ${res.url}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

const run = async () => {
  // URL 1
  await testUrl(
    "https://nekopoi.care/ucen-lagi-main-warnet-diganggu-kakak-mesum/"
  );

  // URL 2 (The one failing)
  await testUrl("https://nekopoi.care/l2d-shirao-eri-blue-archive/");

  // URL 3
  await testUrl(
    "https://nekopoi.care/3d-ada-wong-dan-alcina-dimitrescu-brutal-dikereta-resident-evil/"
  );
};

run();
