import fetch from 'node-fetch';

async function test() {
  console.log("Testing search...");
  let res = await fetch("http://localhost:3001/api/hnime/search?q=");
  let data = await res.json();
  console.log("Search hits:", data.hits ? JSON.parse(data.hits).length : 0);
  
  if (data.hits && JSON.parse(data.hits).length > 0) {
    let first = JSON.parse(data.hits)[0];
    console.log("First hit:", first);
    
    console.log(`Testing video detail for slug: ${first.slug}...`);
    let vRes = await fetch(`http://localhost:3001/api/hnime/video/${encodeURIComponent(first.slug)}`);
    let vData = await vRes.json();
    console.log("Video data:", vData);
  }
}

test().catch(console.error);
