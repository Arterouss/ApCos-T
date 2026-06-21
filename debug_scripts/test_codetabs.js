import fetch from "node-fetch";

async function testCodeTabs() {
  const targetUrl = "https://pornavhd.com/";
  console.log("Testing CodeTabs...");
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
    console.log("CodeTabs status:", res.status);
    const text = await res.text();
    console.log("CodeTabs length:", text.length);
    console.log("CodeTabs preview:", text.substring(0, 500));
  } catch(e) {
    console.error("CodeTabs failed:", e.message);
  }
}
testCodeTabs();
