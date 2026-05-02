const fetch = require('node-fetch');

async function testHanime() {
    try {
        const res = await fetch("https://hanime.tv/api/v8/browse-trending?time=week&page=0", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response starts with:", text.substring(0, 200));
    } catch (e) {
        console.error(e);
    }
}
testHanime();
