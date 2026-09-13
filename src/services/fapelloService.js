import axios from "axios";

const API_BASE = "/api/fapello";

export const getFapelloList = async (page = 1, search = "", sort = "trending") => {
  const params = { page, sort };
  if (search) params.search = search;
  const res = await axios.get(`${API_BASE}/list`, { params });
  return res.data;
};

export const getFapelloModel = async (slug) => {
  const res = await axios.get(`${API_BASE}/model/${slug}`);
  return res.data;
};
