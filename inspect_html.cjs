const cheerio = require('cheerio');

async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://rule34video.com/latest-updates/1/', {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "text/html"
    }
  });
  
  console.log("Status:", res.status);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Videos count:", $('.thumb, .item, .video-item, .item-video').length);
  console.log("A tags with video:", $('a[href*="/video/"]').length);
  const firstVideo = $('a[href*="/video/"]').first();
  console.log("First video HTML:");
  console.log($.html(firstVideo));
  console.log("First video parent HTML:");
  console.log($.html(firstVideo.parent()));
}

test().catch(console.error);
