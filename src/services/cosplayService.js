const API_URL = "http://localhost:3001/api/cosplay";

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
    if (!res.ok) throw new Error("Failed to fetch cosplay detail");
    return await res.json();
  } catch (error) {
    console.error("Error fetching cosplay detail:", error);
    return null;
  }
};
