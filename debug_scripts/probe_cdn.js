import fetch from "node-fetch";

async function run() {
  const id = "94d98b41-8526-4f9f-86fe-201a01c60fe1.mp4";
  const domains = [
    "https://cdn.bunkr.ru",
    "https://stream.bunkr.ru",
    "https://media-files.bunkr.cr",
    "https://files.bunkr.ru",
    "https://i-cheese.bunkr.ru",
    "https://bunkr.ph", // Sometimes on the main domain
    "https://get.bunkrr.su",
  ];

  for (const domain of domains) {
    const url = `${domain}/${id}`;
    console.log(`Trying ${url}...`);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Range: "bytes=0-100",
          Referer: "https://bunkr.cr/",
        },
      });
      console.log(
        `  Status: ${res.status} Type: ${res.headers.get("content-type")}`,
      );
      if (res.status === 200 || res.status === 206 || res.status === 302) {
        console.log("  MATCH FOUND!");
        const text = await res.text();
        console.log("  Body Preview: " + text.substring(0, 200));
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

run();
