import axios from 'axios';

const tests = [
  'https://api.iwara.tv/videos?page=0&limit=8&sort=date&rating=ecchi',
  'https://api.iwara.tv/videos?page=0&limit=8&sort=date&rating=all',
  'https://api.iwara.tv/videos?page=0&limit=8&sort=date',
  'https://api.iwara.tv/videos?page=0&limit=8',
];

for (const url of tests) {
  try {
    const r = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      timeout: 10000
    });
    const results = r.data?.results || r.data;
    const count = Array.isArray(results) ? results.length : 'N/A';
    const sample = Array.isArray(results) && results[0] ? {
      id: results[0].id,
      title: results[0].title?.slice(0,40),
      rating: results[0].rating,
      file: results[0].file?.id?.slice(0,20),
      thumbnail: results[0].thumbnail,
    } : results;
    console.log(`✅ ${url.split('?')[1]}`);
    console.log(`   Count: ${count}, Sample:`, JSON.stringify(sample));
  } catch(e) {
    console.log(`❌ ${url.split('?')[1]}: ${e.response?.status} ${e.message}`);
  }
}
