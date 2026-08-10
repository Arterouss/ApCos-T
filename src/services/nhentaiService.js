const API_BASE = "/api/nhentai";

export const fetchNhentaiGalleries = async (page = 1, query = "", sort = "") => {
  let url = `${API_BASE}/galleries?page=${page}&query=${encodeURIComponent(query)}`;
  if (sort) url += `&sort=${sort}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch nhentai galleries");
  }
  return response.json();
};

export const fetchNhentaiDetail = async (id) => {
  const url = `${API_BASE}/galleries/${id}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch nhentai gallery detail");
  }
  return response.json();
};
