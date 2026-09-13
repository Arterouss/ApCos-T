import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('hentaiplay_home.html', 'utf-8');
const $ = cheerio.load(html);

// The first link in each post goes to hentai-english-subbed/ which is the episode URL
// Let's look at each post more carefully - maybe the title's <a> has the specific link
$('.post').each((i, el) => {
  if (i >= 3) return;
  const $el = $(el);
  
  // Get the FIRST link (should be the direct video page link)
  const firstLink = $el.find('a').first();
  const titleEl = $el.find('h2, h3, .entry-title, .post-title');
  const titleLink = titleEl.find('a').first();
  
  console.log(`--- Post ${i} ---`);
  console.log("First link href:", firstLink.attr('href'));
  console.log("First link text:", firstLink.text().trim().slice(0, 60));
  console.log("Title link href:", titleLink.attr('href'));
  console.log("Title text:", titleEl.text().trim().slice(0, 80));
  
  // Show entire post HTML condensed
  const postHTML = $el.html().replace(/\s+/g, ' ').slice(0, 500);
  console.log("Post HTML snippet:", postHTML);
  console.log();
});
