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
// Fetch stream with multi-layer fallback (backend first, direct client, then proxies)
export const getOreno3dStream = async (iwaraId) => {
  try {
    // 1. Try our backend first (with fast fail)
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const backendRes = await fetch(`${API_URL}/stream?iwaraId=${iwaraId}`, { signal: controller.signal });
      clearTimeout(id);
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.rawVideoUrls && data.rawVideoUrls.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Backend stream fetch failed/timed out, trying direct & proxy fallbacks...", e);
    }

    // 2. Try DIRECT client-side fetch (in case browser has CORS unblocker or valid credentials)
    const infoUrl = `https://api.iwara.tv/video/${iwaraId}`;
    let info = null;

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(infoUrl, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) info = await res.json();
    } catch (e) {
      console.warn("Direct client info fetch failed (CORS/network):", e.message);
    }

    // 3. Fallback: Try corsproxy with fast timeout if direct failed
    if (!info) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        const corsproxyUrl = `https://corsproxy.io/?${encodeURIComponent(infoUrl)}`;
        const res = await fetch(corsproxyUrl, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) info = await res.json();
      } catch (e) {
        console.warn("corsproxy info fetch failed:", e);
      }
    }

    // 4. Fallback: Try allorigins if both failed
    if (!info) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(infoUrl)}`;
        const res = await fetch(allOriginsUrl, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) info = await res.json();
      } catch (e) {
        console.warn("allorigins fetch failed:", e);
      }
    }
    
    if (!info || !info.fileUrl) {
      return { rawVideoUrls: [], error: "Cloudflare protection active on Iwara API." };
    }

    const fileUrl = info.fileUrl;

    // 5. Compute X-Version signature
    const fileId = info.file?.id || "";
    const fullUrl = fileUrl.startsWith("//") ? "https:" + fileUrl : fileUrl;
    const parsedUrl = new URL(fullUrl);
    const expires = parsedUrl.searchParams.get("expires") || "";
    
    const xVersion = await sha1(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`);

    // 6. Fetch sources using direct, local proxy, or corsproxy
    let sourcesData = null;
    const sourcesUrl = `https:${fileUrl}`;
    
    // Try direct sources fetch first
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(sourcesUrl, {
        headers: { "X-Version": xVersion },
        signal: controller.signal
      });
      clearTimeout(id);
      if (res.ok) sourcesData = await res.json();
    } catch (e) {
      console.warn("Direct sources fetch failed, trying proxy...");
    }

    if (!sourcesData) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        const localProxyUrl = `/api/proxy?url=${encodeURIComponent(sourcesUrl)}`;
        const res = await fetch(localProxyUrl, {
          headers: { "X-Version": xVersion },
          signal: controller.signal
        });
        clearTimeout(id);
        if (res.ok) sourcesData = await res.json();
      } catch (e) {
        console.warn("Local proxy fetch failed, trying corsproxy...");
      }
    }

    if (!sourcesData) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3500);
        const corsproxySourcesUrl = `https://corsproxy.io/?${encodeURIComponent(sourcesUrl)}`;
        const res = await fetch(corsproxySourcesUrl, {
          headers: { "X-Version": xVersion },
          signal: controller.signal
        });
        clearTimeout(id);
        if (res.ok) sourcesData = await res.json();
      } catch(e) {}
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

