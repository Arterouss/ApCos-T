import fetch from "node-fetch";

const checkImage = async () => {
  // A typical image URL from Nekopoi (e.g. thumb)
  // We can pick one from recent output or just use a generic one.
  // Let's use a dummy OnePiece image or similar if possible, or just a known external image that might be blocked by ISP but proxy handles.
  // Actually, let's use a real Nekopoi image URL if we can find one.
  // If not, use a bunkr request to get one?
  // Let's just use the generic external image handling.

  const targetUrl =
    "https://nekopoi.care/wp-content/uploads/2024/05/cropped-Nekopoi-Logo-2024.png"; // Example logo?
  // If that fails, let's use a known working one.

  const proxyUrl = `http://localhost:3001/api/proxy/image?url=${encodeURIComponent(targetUrl)}`;
  console.log(`Testing Image Proxy: ${proxyUrl}`);

  try {
    const res = await fetch(proxyUrl);
    console.log(`Status: ${res.status}`);
    console.log(`Content-Type: ${res.headers.get("content-type")}`);

    if (res.ok && res.headers.get("content-type")?.startsWith("image/")) {
      console.log("SUCCESS: Image proxy working.");
    } else {
      console.log("FAILURE: Image proxy failed.");
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
};

checkImage();
