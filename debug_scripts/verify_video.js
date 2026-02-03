import fetch from "node-fetch";

const SLUG = "92FdPm34"; // "seravin fern" album
const URL = `http://localhost:3001/api/hnime/video/${SLUG}`;

async function run() {
  try {
    console.log(`Fetching ${URL}...`);
    const res = await fetch(URL);
    if (!res.ok) {
      console.error(`Error: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log("Body:", text);
      return;
    }
    const data = await res.json();
    console.log("Success!");
    console.log("Title:", data.title);
    console.log("Stream URL:", data.iframe_url);

    if (data.sources) {
      console.log("Sources:");
      data.sources.forEach((s) => {
        console.log(
          `- [${s.type}] ${s.name} ${s.isDefault ? "(DEFAULT)" : ""} URL: ${s.url}`,
        );
      });

      const defaultSource = data.sources.find((s) => s.isDefault);
      if (defaultSource) {
        console.log(
          `Default Source matches: ${defaultSource.name} (${defaultSource.type})`,
        );
      } else {
        console.log(
          "No default source matched in list (iframe_url might be from first file fallback or empty).",
        );
      }
    }
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
run();
