import fetch from "node-fetch";

const testFallback = async () => {
  // 1. Request a URL that is likely to fail direct fetch (or we can mock it by using a 403 endpoint if we knew one)
  // For now, let's use a URL that we know triggers the fallback logic if we can.
  // Or, we can just rely on the server logs printing "Trying Fallback" when we hit a 404/403.

  // Let's try a google.com 404 page, which might yield 404 and trigger fallback?
  // Our logic: if (!response.ok && status !== 302 && status !== 301) -> Fallback.
  // So a 404 should trigger fallback.

  const targetUrl = "https://google.com/non-existent-page-for-test";
  const proxyUrl = `http://localhost:3001/api/proxy?url=${encodeURIComponent(targetUrl)}`;

  console.log(`Testing Proxy Fallback with: ${targetUrl}`);

  try {
    const res = await fetch(proxyUrl);
    console.log(`Proxy Status: ${res.status}`);
    const text = await res.text();

    // We can't easily assert "Fallback used" without checking server logs,
    // but we can check if we got a response.
    // CorsProxy usually returns the content even if it's 404 from upstream.
    console.log("Response length:", text.length);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
};

testFallback();
