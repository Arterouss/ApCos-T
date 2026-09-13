import * as cheerio from 'cheerio';
import fs from 'fs';

// Analyze Porn3dx structure
const html = fs.readFileSync('porn3dx.html', 'utf8');
const $ = cheerio.load(html);

console.log('=== PORN3DX VIDEO LINKS (first 15) ===');
let count = 0;
$('a').each((i, el) => {
  const href = $(el).attr('href') || '';
  if (href.includes('/videos/') && count < 15) {
    const title = $(el).attr('title') || $(el).text().replace(/\s+/g,' ').trim().slice(0,50);
    const img = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || 'none';
    console.log(`href: ${href}`);
    console.log(`title: ${title}`);
    console.log(`img: ${img.slice(0,80)}`);
    console.log('---');
    count++;
  }
});

console.log('\n=== PORN3DX IMG CARDS (sample) ===');
$('article, .video-card, [class*=card], [class*=item], [class*=thumb]').slice(0,5).each((i, el) => {
  console.log('tag:', el.name, 'class:', $(el).attr('class'));
  const a = $(el).find('a').first();
  const img = $(el).find('img').first();
  console.log('  link:', a.attr('href'));
  console.log('  img:', img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src'));
  console.log('  title:', a.attr('title') || a.text().replace(/\s+/g,' ').trim().slice(0,50));
});

// Analyze Fapello structure
const fhtml = fs.readFileSync('fapello.html', 'utf8');
const $f = cheerio.load(fhtml);

console.log('\n=== FAPELLO MODEL LINKS (first 15) ===');
let fcount = 0;
$f('a').each((i, el) => {
  const href = $f(el).attr('href') || '';
  if (href.match(/fapello\.com\/[a-z0-9_-]+\/?$/) && fcount < 15) {
    const img = $f(el).find('img').attr('src') || $f(el).find('img').attr('data-src') || 'none';
    const name = $f(el).text().replace(/\s+/g,' ').trim().slice(0,50);
    console.log(`href: ${href}`);
    console.log(`name: ${name}`);
    console.log(`img: ${img.slice(0,80)}`);
    console.log('---');
    fcount++;
  }
});

console.log('\n=== FAPELLO CARDS ===');
$f('[class*=model],[class*=card],[class*=item],[class*=creator]').slice(0,5).each((i, el) => {
  console.log('tag:', el.name, 'class:', $f(el).attr('class'));
  const a = $f(el).find('a').first();
  const img = $f(el).find('img').first();
  console.log('  link:', a.attr('href'));
  console.log('  img:', img.attr('src') || img.attr('data-src') || 'none');
  console.log('  text:', $f(el).text().replace(/\s+/g,' ').trim().slice(0,80));
});
