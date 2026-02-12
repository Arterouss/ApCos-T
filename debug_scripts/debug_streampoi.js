import fetch from "node-fetch";

const fetchViaProxy = async (targetUrl) => {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://nekopoi.care/",
  };

  try {
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
    console.log(`Fetching via CodeTabs: ${proxyUrl}`);
    const res = await fetch(proxyUrl, { headers });
    if (res.ok) return await res.text();
    console.log(`CodeTabs failed: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  return null;
};

async function run() {
  const url = "https://streampoi.com/embed-pno2xt98ica8.html";
  console.log(`Inspecting Streampoi: ${url}`);
  const html = await fetchViaProxy(url);

  if (!html) return;

  // Check for scripts
  const scriptContent = html.split(
    "<script type='text/javascript'>eval(function(p,a,c,k,e,d)",
  )[1];
  if (scriptContent) {
    const fullScript =
      "eval(function(p,a,c,k,e,d)" + scriptContent.split("</script>")[0];
    console.log("\n--- PACKED JS FOUND ---");
    console.log(fullScript);
  } else {
    console.log("\nCould not isolate packed JS.");
    console.log("HTML Preview:", html.substring(0, 500));
  }
}

run();
