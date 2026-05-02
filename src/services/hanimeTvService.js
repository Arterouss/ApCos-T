const API_BASE = "/api/hanime";

export const getHanimeTrending = async (page = 0, time = "month") => {
  const response = await fetch(`${API_BASE}/trending?time=${time}&page=${page}`);
  if (!response.ok) throw new Error("Failed to fetch hanime trending");
  const result = await response.json();
  return result;
};

export const getHanimeVideo = async (id) => {
  const response = await fetch(`${API_BASE}/video?id=${id}`);
  if (!response.ok) throw new Error("Failed to fetch hanime video");
  return await response.json();
};

export const getHanimeSearch = async (query, page = 0) => {
  const response = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query || "")}&page=${page}`
  );
  if (!response.ok) throw new Error("Failed to fetch hanime search results");
  const result = await response.json();
  return result;
};
