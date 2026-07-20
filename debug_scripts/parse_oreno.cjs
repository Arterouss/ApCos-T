const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

const agent = new https.Agent({ rejectUnauthorized: false });

async function inspectItems() {
  const url = 'https://oreno3d.com/';
  const r = await axios.get(url, {
    httpsAgent: agent,
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  const $ = cheerio.load(r.data);

  $('article, .box.pop_separate').slice(0, 3).each((i, el) => {
    console.log('=== ITEM', i, '===');
    console.log($(el).html());
  });
}

inspectItems();
