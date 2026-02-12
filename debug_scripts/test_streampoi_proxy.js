import fetch from "node-fetch";

async function run() {
  // The Streampoi URL we found earlier
  const targetUrl = "https://streampoi.com/embed-pno2xt98ica8.html";
  const proxyUrl = `http://localhost:3001/api/proxy/cossora?url=${encodeURIComponent(targetUrl)}`;

  console.log(`Testing Proxy: ${proxyUrl}`);

  try {
    const res = await fetch(proxyUrl);
    const html = await res.text();

    console.log(`Status: ${res.status}`);

    if (html.includes("<video controls")) {
      console.log("SUCCESS: Found <video> tag in response!");
      // Extract source to verify
      const srcMatch = /<source src="([^"]+)"/.exec(html);
      if (srcMatch) console.log(`Video Source: ${srcMatch[1]}`);
    } else {
      console.log("FAILURE: No <video> tag found.");
      // Check if packed code is present
      if (html.includes("eval(function(p,a,c,k,e,d)")) {
        console.log("Packed code FOUND in response, but not unpacked.");
        // Dump a snippet around the packed code to see why regex failed
        const idx = html.indexOf("eval(function(p,a,c,k,e,d)");
        console.log("Snippet:", html.substring(idx, idx + 200));
      } else {
        console.log("Packed code NOT FOUND in response.");
        console.log("Preview:", html.substring(0, 500));
      }
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

run();
