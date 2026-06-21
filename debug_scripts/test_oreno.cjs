const axios = require('./node_modules/axios/index.cjs');
const cheerio = require('./node_modules/cheerio/lib/index.js');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

axios.get('https://oreno3d.com/', {
  httpsAgent: agent,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' },
  timeout: 10000
}).then(r => {
  const $ = cheerio.load(r.data);
  console.log('Total articles:', $('article').length);
  console.log('Total a.box:', $('article a.box').length);
  console.log('Total .box:', $('.box').length);
  
  // Try different selectors
  $('article').first().find('a').each((i, el) => {
    console.log('article a[' + i + ']:', $(el).attr('href'), '| class:', $(el).attr('class'));
  });
  
  // Show first article raw html
  console.log('\nFirst article HTML (500 chars):', $('article').first().html()?.slice(0, 500));
}).catch(e => console.error('Error:', e.message));
