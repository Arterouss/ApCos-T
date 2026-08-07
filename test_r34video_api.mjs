async function testBackendApi() {
    try {
        console.log("Fetching rule34video list from localhost:3001...");
        const res = await fetch('http://localhost:3001/api/rule34video/list?page=1');
        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response starts with:", text.substring(0, 500));
        
        const data = JSON.parse(text);
        if (data.videos && data.videos.length > 0) {
            console.log("\nFetching detail for first video:", data.videos[0].slug);
            const detailRes = await fetch(`http://localhost:3001/api/rule34video/detail?slug=${encodeURIComponent(data.videos[0].slug)}`);
            const detailText = await detailRes.text();
            console.log("Detail Status:", detailRes.status);
            console.log("Detail Data:", JSON.stringify(JSON.parse(detailText), null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}
testBackendApi();
