import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001";

async function testEndpoint(name, url) {
  console.log(`\nTesting ${name}: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    if (!res.ok) {
      const text = await res.text();
      console.log(`Error Body: ${text.substring(0, 200)}`);
    } else {
      console.log("Success");
    }
  } catch (e) {
    console.log(`Fetch Error: ${e.message}`);
  }
}

async function run() {
  // 1. Test Image Proxy (with a potentially blocked image)
  await testEndpoint(
    "Image Proxy (Nekopoi)",
    `${BASE_URL}/api/proxy/image?url=${encodeURIComponent("https://nekopoi.care/wp-content/uploads/2026/02/vlcsnap-2026-02-09-14h41m45s007-300x169.jpg")}`,
  );

  // 2. Test Cossora Proxy (Vidnest)
  await testEndpoint(
    "Cossora Proxy (Vidnest)",
    `${BASE_URL}/api/proxy/cossora?url=${encodeURIComponent("https://vidnest.io/embed-di28q54jfgps.html")}`,
  );

  // 3. Test Nekopoi Detail (Known Slug)
  // Note: Use a slug found in previous debug output
  const slug =
    "uncensored-ichigo-aika-zatsu-de-namaiki-na-imouto-to-warikirenai-ani-episode-6-subtitle-indonesia";
  await testEndpoint(
    "Nekopoi Detail",
    `${BASE_URL}/api/nekopoi/detail?slug=${slug}`,
  );
  // 4. Test CodeTabs Image Fetch Directly (Debug)
  console.log("\nTesting CodeTabs Direct Image Fetch...");
  const imgUrl =
    "https://nekopoi.care/wp-content/uploads/2026/02/vlcsnap-2026-02-09-14h41m45s007-300x169.jpg";
  const ctUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imgUrl)}`;
  try {
    const res = await fetch(ctUrl);
    console.log(`CodeTabs Status: ${res.status}`);
    if (res.ok) console.log("CodeTabs success!");
    else console.log(`CodeTabs failed: ${res.status}`);
  } catch (e) {
    console.log(`CodeTabs Error: ${e.message}`);
  }
}

run();
