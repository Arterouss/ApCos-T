const API_URL = "/api/oreno3d";

export const getOreno3dLatest = async (page = 1, sort = "latest") => {
  try {
    const res = await fetch(`${API_URL}/latest?page=${page}&sort=${sort}`);
    if (!res.ok) throw new Error("Failed to fetch latest");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getOreno3dSearch = async (query, page = 1) => {
  try {
    const res = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}`,
    );
    if (!res.ok) throw new Error("Failed to fetch search results");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getOreno3dDetail = async (id) => {
  try {
    const res = await fetch(`${API_URL}/detail?id=${id}`);
    if (!res.ok) throw new Error("Failed to fetch detail");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
// Utility to compute SHA-1 hash natively in the browser
async function sha1(str) {
  const buffer = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-1", buffer);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Fetch stream purely from frontend to bypass Vercel's backend IP block
export const getOreno3dStream = async (iwaraId) => {
  try {
    const proxyBase = "https://corsproxy.io/?";

    // 1. Fetch video info to get fileUrl
    const infoUrl = `https://api.iwara.tv/video/${iwaraId}`;
    let res = await fetch(proxyBase + encodeURIComponent(infoUrl));
    if (!res.ok) throw new Error("Could not fetch video info via corsproxy");
    const info = await res.json();
    
    const fileUrl = info.fileUrl;
    if (!fileUrl) throw new Error("No fileUrl found in video info");

    // 2. Compute X-Version signature
    const fileKey = fileUrl.split("/")[6] || "";
    const xVersion = await sha1(`${fileKey}_5nFp9kmbNnHdAFhaqMvt`);

    // 3. Fetch sources with X-Version
    const sourcesUrl = `https:${fileUrl}`;
    res = await fetch(proxyBase + encodeURIComponent(sourcesUrl), {
      headers: { "X-Version": xVersion },
    });
    if (!res.ok) throw new Error("Could not fetch stream sources via corsproxy");
    const sourcesData = await res.json();

    const rawVideoUrls = [];
    if (Array.isArray(sourcesData)) {
      const qualityOrder = { "Source": 0, "720": 1, "540": 2, "360": 3 };
      const sorted = [...sourcesData].sort((a, b) =>
        (qualityOrder[a.name] ?? 99) - (qualityOrder[b.name] ?? 99)
      );
      for (const src of sorted) {
        if (src.src?.download) {
          rawVideoUrls.push({
            url: `https:${src.src.download}`,
            referer: "https://www.iwara.tv/",
            quality: src.name || "Unknown",
          });
        }
      }
    }
    return { rawVideoUrls, debug: ["Frontend fetch success"] };
  } catch (error) {
    console.error("Stream Service Error:", error);
    return { rawVideoUrls: [], error: error.message };
  }
};
