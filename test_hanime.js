import axios from 'axios';

const ZENROWS_API_KEY = "fd59cc48a92c0890bdf3aad5a12a0008d042f551";

async function test() {
  const url = `https://hanime.tv/api/v8/video?id=enjo-kouhai-1`;
  const proxy = `https://api.zenrows.com/v1/?apikey=${ZENROWS_API_KEY}&url=${encodeURIComponent(url)}&premium_proxy=true`;
  try {
    const res = await axios.get(proxy);
    console.log("SUCCESS:", JSON.stringify(res.data).slice(0, 500));
  } catch(e) {
    console.log("FAIL:", e.response ? e.response.status : e.message);
  }
}
test();
