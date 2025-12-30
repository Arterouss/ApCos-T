const API_BASE = "http://localhost:3001/api/hnime";

export const getHimeTrending = async () => {
  try {
    const response = await fetch(`${API_BASE}/trending`);
    if (!response.ok) throw new Error("Failed to fetch HAnime trending");
    return await response.json();
  } catch (error) {
    console.error("HAnime Trending Error:", error);
    return [];
  }
};

export const getHimeVideo = async (slug) => {
  try {
    const response = await fetch(`${API_BASE}/video/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch HAnime video");
    return await response.json();
  } catch (error) {
    console.error("HAnime Video Error:", error);
    throw error;
  }
};

export const getHimeSearch = async (query, page = 0) => {
  try {
    const response = await fetch(
      `${API_BASE}/search/${encodeURIComponent(query)}?page=${page}`
    );
    if (!response.ok) throw new Error("Failed to search HAnime");
    return await response.json();
  } catch (error) {
    console.error("HAnime Search Error:", error);
    return [];
  }
};
