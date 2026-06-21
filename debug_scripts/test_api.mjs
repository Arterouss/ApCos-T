import fetch from 'node-fetch';

async function test() {
  try {
    console.log("Testing hnime/search API via local express...");
    const res = await fetch("http://localhost:3001/api/hnime/search");
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Hits returned:", data.hits ? JSON.parse(data.hits).length : 0);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
