import axios from 'axios';
async function test() {
  try {
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent("https://api.iwara.tv/videos?page=0&limit=1")}`;
    const r = await axios.get(proxied);
    console.log(JSON.stringify(r.data.results[0], null, 2));
  } catch(e) {
    console.error(e.message);
  }
}
test();
