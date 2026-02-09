const API_URL = "/api/nekopoi";

export const getNekopoiLatest = async (page = 1) => {
  try {
    const res = await fetch(`${API_URL}/latest?page=${page}`);
    if (!res.ok) throw new Error("Failed to fetch latest");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const getNekopoiDetail = async (slug) => {
  try {
    const res = await fetch(`${API_URL}/detail?slug=${slug}`);
    if (!res.ok) throw new Error("Failed to fetch detail");
    return await res.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};
