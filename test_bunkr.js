import fetch from 'node-fetch'; // mock import

async function test() {
  const res = await fetch('https://bunkr.si');
  const text = await res.text();
  const allLinks = text.match(/href=["'](.*?)["']/g);
  console.log("All Links:", allLinks ? allLinks.slice(0, 30) : 'None');
}
test();
