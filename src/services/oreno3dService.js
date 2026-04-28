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
  }
};

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
    // 1. Fetch video info to get fileUrl - using allorigins for metadata (metadata usually doesn't need custom headers)
    const infoUrl = `https://api.iwara.tv/video/${iwaraId}`;
    const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(infoUrl)}`;
    
    let res = await fetch(allOriginsUrl);
    if (!res.ok) throw new Error("Could not fetch video info via allorigins");
    const info = await res.json();
    
    const fileUrl = info.fileUrl;
    if (!fileUrl) throw new Error("No fileUrl found in video info");

    // 2. Compute X-Version signature using file.id and expires
    const fileId = info.file?.id || "";
    const fullUrl = fileUrl.startsWith("//") ? "https:" + fileUrl : fileUrl;
    const parsedUrl = new URL(fullUrl);
    const expires = parsedUrl.searchParams.get("expires") || "";
    
    const xVersion = await sha1(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`);

    // 3. Fetch sources using our own /api/proxy (which we've updated to forward X-Version)
    // This bypasses CORS and keeps the headers intact
    const sourcesUrl = `https:${fileUrl}`;
    const localProxyUrl = `/api/proxy?url=${encodeURIComponent(sourcesUrl)}`;
    
    res = await fetch(localProxyUrl, {
      headers: { "X-Version": xVersion },
    });
    
    if (!res.ok) throw new Error("Could not fetch stream sources via local proxy");
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
    return { rawVideoUrls, debug: ["Frontend proxy fetch success"] };
  } catch (error) {
    console.error("Stream Service Error:", error);
    return { rawVideoUrls: [], error: error.message };
  }
};
