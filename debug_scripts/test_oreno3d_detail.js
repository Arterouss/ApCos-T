import fetch from "node-fetch";
import * as fs from "fs";

async function run() {
  try {
    const res = await fetch("https://api.codetabs.com/v1/proxy?quest=https://oreno3d.com/movies/322906");
    const html = await res.text();
    fs.writeFileSync("oreno3d_detail.html", html);
    console.log("Saved to oreno3d_detail.html");
  } catch (e) {
    console.error(e);
  }
}
run();
