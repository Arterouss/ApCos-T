import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('pornavhd_com_dump.html', 'utf8');
const $ = cheerio.load(html);

console.log("Analyzing pornavhd.com HTML...");

// See if we can find posts
const posts = [];
$('article').each((i, el) => {
    const title = $(el).find('h2, h3').text().trim() || $(el).find('a').attr('title');
    const url = $(el).find('a').attr('href');
    const thumb = $(el).find('img').attr('src');
    posts.push({title, url, thumb});
});

console.log("Found posts using <article>:", posts.slice(0, 5));

if (posts.length === 0) {
    // Try something else like typical WP classes
    const wpPosts = [];
    $('.type-post, .post').each((i, el) => {
        const title = $(el).find('h2, h3, .entry-title').text().trim();
        const url = $(el).find('a').attr('href');
        const thumb = $(el).find('img').attr('src');
        wpPosts.push({title, url, thumb});
    });
    console.log("Found posts using .type-post:", wpPosts.slice(0, 5));
}
