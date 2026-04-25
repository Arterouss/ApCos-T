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

// Called on-demand when user wants to play — separate from detail to avoid timeout
export const getOreno3dStream = async (iwaraId) => {
  try {
    const res = await fetch(`${API_URL}/stream?iwaraId=${iwaraId}`);
    if (!res.ok) throw new Error("Stream fetch failed");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { rawVideoUrls: [] };
  }
};
