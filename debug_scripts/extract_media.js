import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('pornavhd_video_puppeteer.html', 'utf8');
const $ = cheerio.load(html);

const iframes = [];
$('iframe').each((i, el) => {
  iframes.push({
    src: $(el).attr('src'),
    dataLink: $(el).attr('data-link'),
    id: $(el).attr('id')
  });
});

console.log("Iframes:", iframes);

const videos = [];
$('video').each((i, el) => {
  videos.push({
    src: $(el).attr('src'),
    poster: $(el).attr('poster')
  });
});
$('source').each((i, el) => {
  videos.push({
    src: $(el).attr('src'),
    type: $(el).attr('type')
  });
});

console.log("Videos:", videos);
