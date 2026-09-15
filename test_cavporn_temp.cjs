const cheerio = require('cheerio');
const https = require('https');
const agent = new https.Agent({ rejectUnauthorized: false });

const options = {
  hostname: 'cav107.com',
  path: '/newvideo/',
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  agent
};

https.get(options, (res) => {
  let html = '';
  res.on('data', d => { html += d; });
  res.on('end', () => {
    const $ = cheerio.load(html);
    const videoLinks = [];
    $('a').each(function() {
      const href = $(this).attr('href') || '';
      if (/\/video\/(\d+)\//.test(href)) videoLinks.push(href);
    });
    console.log('Total video links:', videoLinks.length);
    if (videoLinks.length > 0) {
      console.log('Samples:', JSON.stringify(videoLinks.slice(0, 5)));
    } else {
      // Show all anchor hrefs
      const allHrefs = [];
      $('a').each(function() {
        const h = $(this).attr('href');
        if (h && !allHrefs.includes(h)) allHrefs.push(h);
      });
      console.log('All unique hrefs (first 20):', JSON.stringify(allHrefs.slice(0, 20)));
      console.log('HTML snippet:', html.slice(2000, 3500));
    }
  });
}).on('error', (e) => console.error('Error:', e.message));
