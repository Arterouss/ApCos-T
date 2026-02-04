import fetch from "node-fetch";

async function run() {
  // Use a known download URL from previous logs
  const url = "https://get.bunkrr.su/file/51130424";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://bunkr.cr/",
      },
      redirect: "manual", // Don't follow redirects automatically to see if we get a 302
    });

    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);
    console.log(`Location: ${res.headers.get("location")}`);

    if (res.status === 200) {
      const text = await res.text();
      console.log("Searching for links...");
      const lines = text.split("\n");
      lines.forEach((line) => {
        if (line.includes('href="') || line.includes(".mp4")) {
          console.log(line.trim());
        }
      });
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

run();
