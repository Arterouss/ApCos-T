import fetch from "node-fetch";

const fetchViaProxy = async (targetUrl) => {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Referer: "https://cosplaytele.com/",
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

// Helper to unpack P.A.C.K.E.R code
const unpack = (p, a, c, k, e, d) => {
  while (c--)
    if (k[c])
      p = p.replace(new RegExp("\\b" + c.toString(a) + "\\b", "g"), k[c]);
  return p;
};

async function run() {
  const url = "https://streampoi.com/embed-pno2xt98ica8.html";
  console.log(`Inspecting Streampoi: ${url}`);
  const html = await fetchViaProxy(url);

  if (!html) return;
  console.log("HTML length:", html.length);

  // --- LOGIC FROM BACKEND ---
  // 1. Check for P.A.C.K.E.R (Streampoi)
  if (html && html.includes("eval(function(p,a,c,k,e,d)")) {
    try {
      console.log("Packer detected (includes check passed)");
      // Robust extraction: Split by the start of the packer function
      const parts = html.split("eval(function(p,a,c,k,e,d)");
      console.log("Split parts:", parts.length);

      if (parts.length > 1) {
        // Get the part after the preamble
        let packedBlock = parts[1];

        // Find the payload start (after the function body)
        const payloadStart = packedBlock.indexOf("}('");
        console.log("Payload start index:", payloadStart);

        if (payloadStart !== -1) {
          packedBlock = packedBlock.substring(payloadStart + 2); // Start after }('

          // Let's try to find the split pattern first
          const splitIndex = packedBlock.lastIndexOf(".split('|')))");
          console.log("Split index:", splitIndex);

          if (splitIndex !== -1) {
            const headerPart = packedBlock.substring(0, splitIndex);
            // headerPart looks like: payload',radix,count,'keywords'

            // The keywords are at the end: ,'keywords'
            const lastCommaInfo = headerPart.lastIndexOf(",'");
            console.log("Last comma info:", lastCommaInfo);

            if (lastCommaInfo !== -1) {
              const keywordsRaw = headerPart.substring(
                lastCommaInfo + 2,
                headerPart.length - 1,
              ); // remove ' at end
              const k = keywordsRaw.split("|");

              const rest = headerPart.substring(0, lastCommaInfo);
              // rest: payload',radix,count

              const lastCommaCount = rest.lastIndexOf(",");
              const count = parseInt(rest.substring(lastCommaCount + 1));

              const rest2 = rest.substring(0, lastCommaCount);
              const lastCommaRadix = rest2.lastIndexOf(",");
              const radix = parseInt(rest2.substring(lastCommaRadix + 1));

              const payload = rest2.substring(0, lastCommaRadix - 1); // remove ' at end

              console.log(
                `Payload length: ${payload.length}, Radix: ${radix}, Count: ${count}, Keywords: ${k.length}`,
              );

              const unpacked = unpack(payload, radix, count, k, 0, {});
              console.log("Unpacked length:", unpacked.length);

              const fileMatch = /file:\s*["']([^"']+)["']/.exec(unpacked);
              if (fileMatch && fileMatch[1]) {
                const videoUrl = fileMatch[1];
                console.log("SUCCESS! Video URL:", videoUrl);
              } else {
                console.log("FAILED to find file match in unpacked code.");
                console.log("Unpacked snippet:", unpacked.substring(0, 500));
              }
            } else {
              console.log("Last comma info not found");
            }
          } else {
            console.log("Split index not found");
            console.log("Block snippet:", packedBlock.substring(0, 200));
          }
        } else {
          console.log("Payload start not found");
        }
      }
    } catch (e) {
      console.warn("Packer unpack error:", e.message);
    }
  } else {
    console.log("Packer NOT detected in HTML");
    console.log("HTML snippet:", html.substring(0, 200));
  }
}

run();
