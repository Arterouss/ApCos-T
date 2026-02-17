import fetch from "node-fetch";

const DOMAINS = [
  "https://bunkr.si",
  "https://bunkr.cr",
  "https://bunkr.ru",
  "https://bunkr.ph",
  "https://bunkr.sk",
  "https://bunkr.la",
];

async function testDomains() {
  console.log("Testing Bunkr Domains...");

  for (const domain of DOMAINS) {
    try {
      console.log(`\nChecking ${domain}...`);
      const res = await fetch(`${domain}/?search=test`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        timeout: 5000,
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        if (text.includes("group/item")) {
          console.log("SUCCESS: Found search results structure!");
        } else if (
          text.includes("Just a moment") ||
          text.includes("Cloudflare")
        ) {
          console.log("BLOCKED: Cloudflare");
        } else {
          console.log(`Content Length: ${text.length} (Likely generic/empty)`);
        }
      }
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
}

testDomains();
