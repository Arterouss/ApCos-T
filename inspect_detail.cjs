const cheerio = require('cheerio');

async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://rule34video.com/video/4539345/ayaka-x-raiden/', {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  console.log("Iframe srcs:");
  console.log($('iframe').map((i,el)=>$(el).attr('src')).get());
  
  console.log("\nVideo/Source srcs:");
  console.log($('video, source').map((i,el)=>$(el).attr('src')).get());
  
  console.log("\nScript tags containing video URL:");
  $('script').each((i, el) => {
    const text = $(el).html();
    if (text && (text.includes('kt_player(') || text.includes('video_url') || text.includes('embed'))) {
      console.log(`Script ${i}:`);
      console.log(text.substring(0, 500)); // print first 500 chars
    }
  });
}
test().catch(console.error);
