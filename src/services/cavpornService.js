const API_URL = "/api/cavporn";

export const getCavPornLatest = async (page = 1) => {
  try {
    const res = await fetch(`${API_URL}/latest?page=${page}`);
    if (!res.ok) throw new Error("Failed to fetch CavPorn latest");
    return await res.json();
  } catch (error) {
    console.error("Error fetching CavPorn latest:", error);
    return [];
  }
};

export const getCavPornSearch = async (query, page = 1) => {
  try {
    const res = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}`,
    );
    if (!res.ok) throw new Error("Failed to search CavPorn");
    return await res.json();
  } catch (error) {
    console.error("Error searching CavPorn:", error);
    return [];
  }
};

export const getCavPornCategories = async () => {
  try {
    const res = await fetch(`${API_URL}/categories`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (error) {
    console.error("Error fetching CavPorn categories:", error);
    return [];
  }
};

export const getCavPornCategoryVideos = async (hash, page = 1) => {
  try {
    const res = await fetch(`${API_URL}/category?hash=${hash}&page=${page}`);
    if (!res.ok) throw new Error("Failed to fetch category videos");
    return await res.json();
  } catch (error) {
    console.error("Error fetching CavPorn category videos:", error);
    return [];
  }
};

export const getCavPornTags = async () => {
  try {
    const res = await fetch(`${API_URL}/tags`);
    if (!res.ok) throw new Error("Failed to fetch tags");
    return await res.json();
  } catch (error) {
    console.error("Error fetching CavPorn tags:", error);
    return [];
  }
};

export const getCavPornDetail = async (id, slug) => {
  try {
    const res = await fetch(`${API_URL}/detail?id=${id}&slug=${slug || ""}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch detail: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching CavPorn detail:", error);
    throw error;
  }
};
