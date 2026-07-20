const axios = require("axios");

async function testLive() {
  const id = "340810"; // sample from oreno3d
  console.log(`--- Testing Detail API for ${id} ---`);
  try {
    const resDetail = await axios.get(`http://localhost:3001/api/oreno3d/detail?id=${id}`, { timeout: 8000 });
    console.log("Detail Status:", resDetail.status);
    console.log("Detail Data:", resDetail.data);
    
    const iwaraId = resDetail.data?.iwaraVideoId || resDetail.data?.iwaraId || id;
    console.log(`\n--- Testing Stream API for iwaraId=${iwaraId} ---`);
    const resStream = await axios.get(`http://localhost:3001/api/oreno3d/stream?iwaraId=${iwaraId}`, { timeout: 15000 });
    console.log("Stream Status:", resStream.status);
    console.log("Stream Data:", resStream.data);
  } catch(e) {
    console.error("Error:", e.message);
    if (e.response) {
      console.error("Response Status:", e.response.status, e.response.data);
    }
  }
}

testLive();
