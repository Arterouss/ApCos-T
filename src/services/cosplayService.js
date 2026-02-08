const API_URL = "/api/cosplay";

export const getCosplayLatest = async (page = 1) => {
  try {
    const res = await fetch(`${API_URL}/latest?page=${page}`);
    if (!res.ok) throw new Error("Failed to fetch cosplay latest");
    return await res.json();
  } catch (error) {
    console.error("Error fetching cosplay latest:", error);
    return [];
  }
};

export const getCosplaySearch = async (query, page = 1) => {
  try {
    const res = await fetch(
      `${API_URL}/search?q=${encodeURIComponent(query)}&page=${page}`,
    );
    if (!res.ok) throw new Error("Failed to search cosplay");
    return await res.json();
  } catch (error) {
    console.error("Error searching cosplay:", error);
    return [];
  }
};

export const getCosplayDetail = async (slug) => {
  try {
    const res = await fetch(`${API_URL}/detail?slug=${slug}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch detail: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching cosplay detail:", error);
    throw error;
  }
};

export const getCosplayVideos = async (page = 1) => {
  try {
    const res = await fetch(`${API_URL}/videos?page=${page}`);
    if (!res.ok) throw new Error("Failed to fetch cosplay videos");
    return await res.json();
  } catch (error) {
    console.error("Error fetching cosplay videos:", error);
    return [];
  }
};
