const cheerio = require('cheerio');

async function test() {
  const fetch = (await import('node-fetch')).default;
  const res = await fetch('https://rule34video.com/', {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });
  
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const forms = $('form');
  forms.each((i, el) => {
    console.log(`Form ${i} action:`, $(el).attr('action'));
    console.log(`Form ${i} method:`, $(el).attr('method'));
    console.log(`Form ${i} inputs:`, $(el).find('input').map((i,el)=>$(el).attr('name')).get());
  });
}
test().catch(console.error);
