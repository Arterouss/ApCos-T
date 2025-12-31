import axios from "axios";

const HANIME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const headers = {
  "User-Agent": HANIME_UA,
  Referer: "https://hanime.tv/",
  Origin: "https://hanime.tv",
};

async function testV8() {
  try {
    const slug = "itadaki-seieki";
    console.log(`Fetching ${slug} with Axios (v8)...`);

    // Using the same landing/video endpoint as the proxy
    const response = await axios.get(
      `https://hanime.tv/api/v8/video?id=${slug}`,
      { headers }
    );

    const video = response.data.hentai_video;
    const manifest = response.data.videos_manifest;

    console.log("Video:", video?.name);

    if (manifest && manifest.servers) {
      console.log(`Found ${manifest.servers.length} servers.`);
      manifest.servers.forEach((s) => {
        console.log(`\nServer: ${s.name}`);
        s.streams.forEach((st) => {
          console.log(`  - [${st.height}p] ${st.url}`);
        });
      });
    } else {
      console.log("No manifest or servers found.");
    }
  } catch (error) {
    console.error("Axios Error:", error.message);
    if (error.response) console.error("Status:", error.response.status);
  }
}

testV8();
