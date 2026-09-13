import fetch from 'node-fetch';

const NHENTAI_API_KEY = 'nhk_XfrrpwobmaHgAhlndWpsv5hNQZI_CJIUBD7EULG0Nd9QROs3';
const BASE_URL = 'https://nhentai.net/api/v2';

async function test() {
  const url = `${BASE_URL}/galleries`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${NHENTAI_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) {
      console.log("FAIL:", response.status, response.statusText);
    } else {
      const data = await response.json();
      console.log("SUCCESS:", data.data ? data.data.length : 'no data');
    }
  } catch(e) {
    console.log("ERROR:", e.message);
  }
}
test();
