import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

const agent = new https.Agent({ rejectUnauthorized: false });

try {
  const r = await axios.get('https://oreno3d.com/', {
    httpsAgent: agent,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
    timeout: 10000
  });
  
  // Show first 2000 chars of HTML to understand structure
  console.log('Status:', r.status);
  console.log('HTML preview (2000 chars):');
  console.log(r.data.slice(0, 2000));
} catch(e) {
  console.error('Error:', e.message);
  if (e.response) console.log('Status:', e.response.status, e.response.data?.slice?.(0,500));
}
