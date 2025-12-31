const API_BASE = "/api/hnime";
// NimexH (Powered by Nekopoi Scraper)
export const getHimeTrending = async (page = 1) => {
  // Browse latest uploads via empty search query
  return getHimeSearch("", page);
};

export const getHimeVideo = async (slug) => {
  // Slug might be a path like "hentai/foo" or "2024/01/foo"
  // We append it to the path. If it contains slashes, the wildcard route will verify it.
  // However, safely encoding component is better if we treat it as a single param.
  // But our backend uses wildcard `*` which usually matches raw URL segments.
  // Let's pass it raw if it's a path, or encoded if we want safety.
  // Given express `*` behavior: /api/hnime/video/foo/bar -> slug="foo/bar"

  // Ensure no leading slash in slug to avoid double slash
  const cleanSlug = slug.startsWith("/") ? slug.substring(1) : slug;

  const response = await fetch(`${API_BASE}/video/${cleanSlug}`);
  if (!response.ok) throw new Error("Failed to fetch video");
  return await response.json();
};

export const getHimeSearch = async (query, page = 1) => {
  // query is mapped to 'q' in backend, which maps to 'tags' or 'text'
  const response = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query || "")}&page=${page}`
  );
  if (!response.ok) throw new Error("Failed to fetch search results");
  const result = await response.json();
  // Backend returns hits as stringified JSON (Algolia style)
  if (result.hits && typeof result.hits === "string") {
    try {
      result.hits = JSON.parse(result.hits);
    } catch (e) {
      result.hits = [];
    }
  }
  return result;
};
