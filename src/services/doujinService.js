import axios from "axios";

// Default to backend base URL or empty if served together
const API_BASE = "/api/doujin";

export const getDoujinList = async (page = 1, type = "", genre = "", search = "") => {
  try {
    const params = { page };
    if (type) params.type = type;
    if (genre) params.genre = genre;
    if (search) params.search = search;
    
    const response = await axios.get(`${API_BASE}/list`, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching Doujin list:", error);
    throw error;
  }
};

export const getDoujinDetail = async (slug) => {
  try {
    const response = await axios.get(`${API_BASE}/detail/${slug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Doujin detail:", error);
    throw error;
  }
};

export const getDoujinChapter = async (slug) => {
  try {
    const response = await axios.get(`${API_BASE}/chapter/${slug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Doujin chapter:", error);
    throw error;
  }
};
