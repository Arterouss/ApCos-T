import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import dns from 'dns';

try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch (e) {}

async function resolveSearcho(searchoUrl, referer) {
  try {
    const res = await fetch(searchoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': referer || 'https://jav.guru/' }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    let cid = '', rtype = 'x', keys = [];
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('window.cfg')) {
        const cidM = text.match(/cid:\s*'([^']+)'/);
        if (cidM) cid = cidM[1];
        const rtypeM = text.match(/rtype:\s*'([^']+)'/);
        if (rtypeM) rtype = rtypeM[1];
        const keysM = text.match(/keys:\s*\[([^\]]+)\]/);
        if (keysM) {
          keys = keysM[1].split(',').map(k => k.trim().replace(/['"]/g, ''));
        }
      }
    });

    if (!cid || keys.length === 0) return null;
    const cEl = $('#' + cid);
    if (cEl.length === 0) return null;

    const p1 = cEl.attr(keys[0]) || '';
    const p2 = cEl.attr(keys[1]) || '';
    const p3 = cEl.attr(keys[2]) || '';
    const fullToken = p1 + p2 + p3;
    if (!fullToken) return null;

    const revToken = fullToken.split('').reverse().join('');
    const realSrc = `https://jav.guru/searcho/?${rtype}r=${revToken}`;

    const rRes = await fetch(realSrc, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': searchoUrl }
    });
    return rRes.headers.get('location') || null;
  } catch (e) {
    console.error("Error resolving searcho:", e.message);
    return null;
  }
}

async function testFullDetailScraper() {
  const url = "https://jav.guru/998306/dldss-508-the-best-first-collaboration-where-will-i-be-assigned-two-of-historys-strongest-female-bosses-compete-over-a-young-new-hire-ozawa-naho-mino-suzume/";
  console.log("Scraping detail:", url);
  const startTime = Date.now();
  
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
  });
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const title = $('h1').first().text().trim() || $('title').text().trim();
  const cover = $('.large-screenshot img').attr('src') || $('.imgg img').attr('src') || '';
  
  // Clean description
  const $desc = $('.entry-content, .inside-article').clone();
  $desc.find('script, iframe, .wp-btn-iframe, .sharedaddy, .similars').remove();
  const description = $desc.html() || '';

  // Find server variables
  const scriptContent = $('#wp-btn-iframe-js-extra').html() || '';
  const regex = /var\s+([a-zA-Z0-9_]+)\s*=\s*(\{.*?\});/g;
  let match;
  const serverTasks = [];
  
  while ((match = regex.exec(scriptContent)) !== null) {
    try {
      const obj = JSON.parse(match[2]);
      if (obj && obj.iframe_url) {
        const decodedUrl = Buffer.from(obj.iframe_url, 'base64').toString('utf8');
        serverTasks.push(
          resolveSearcho(decodedUrl, url).then(realUrl => {
            if (realUrl) {
              return {
                name: obj.btn_title || "Server",
                url: realUrl,
                quality: "HD",
                isIframe: true
              };
            }
            return null;
          })
        );
      }
    } catch (e) {}
  }

  const resolvedServers = (await Promise.all(serverTasks)).filter(Boolean);
  console.log(`Done in ${Date.now() - startTime}ms!`);
  console.log("Title:", title);
  console.log("Cover:", cover);
  console.log("Resolved servers count:", resolvedServers.length);
  resolvedServers.forEach((s, idx) => {
    console.log(`Server ${idx + 1}: ${s.url}`);
  });
}

testFullDetailScraper();
