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
// Fetch stream with multi-layer fallback (backend first, then frontend proxies)
export const getOreno3dStream = async (iwaraId) => {
  try {
    // 1. Try our backend first (since backend now has DoH & multi-proxy logic)
    try {
      const backendRes = await fetch(`${API_URL}/stream?iwaraId=${iwaraId}`);
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.rawVideoUrls && data.rawVideoUrls.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Backend stream fetch failed, trying frontend fallback...", e);
    }

    // 2. Fallback: Fetch video info to get fileUrl using corsproxy / allorigins
    const infoUrl = `https://api.iwara.tv/video/${iwaraId}`;
    let info = null;

    try {
      const corsproxyUrl = `https://corsproxy.io/?${encodeURIComponent(infoUrl)}`;
      const res = await fetch(corsproxyUrl);
      if (res.ok) info = await res.json();
    } catch (e) {
      console.warn("corsproxy info fetch failed:", e);
    }

    if (!info) {
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(infoUrl)}`;
      const res = await fetch(allOriginsUrl);
      if (!res.ok) throw new Error("Could not fetch video info via proxies");
      info = await res.json();
    }
    
    const fileUrl = info.fileUrl;
    if (!fileUrl) throw new Error("No fileUrl found in video info");

    // 3. Compute X-Version signature
    const fileId = info.file?.id || "";
    const fullUrl = fileUrl.startsWith("//") ? "https:" + fileUrl : fileUrl;
    const parsedUrl = new URL(fullUrl);
    const expires = parsedUrl.searchParams.get("expires") || "";
    
    const xVersion = await sha1(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`);

    // 4. Fetch sources using local proxy or corsproxy
    let sourcesData = null;
    const sourcesUrl = `https:${fileUrl}`;
    
    try {
      const localProxyUrl = `/api/proxy?url=${encodeURIComponent(sourcesUrl)}`;
      const res = await fetch(localProxyUrl, {
        headers: { "X-Version": xVersion },
      });
      if (res.ok) sourcesData = await res.json();
    } catch (e) {
      console.warn("Local proxy fetch failed, trying corsproxy...");
    }

    if (!sourcesData) {
      const corsproxySourcesUrl = `https://corsproxy.io/?${encodeURIComponent(sourcesUrl)}`;
      const res = await fetch(corsproxySourcesUrl, {
        headers: { "X-Version": xVersion },
      });
      if (!res.ok) throw new Error("Could not fetch stream sources via corsproxy");
      sourcesData = await res.json();
    }

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
    return { rawVideoUrls, debug: ["Frontend multi-proxy fetch success"] };
  } catch (error) {
    console.error("Stream Service Error:", error);
    return { rawVideoUrls: [], error: error.message };
  }
};

