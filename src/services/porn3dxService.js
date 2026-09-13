import axios from "axios";

const API_BASE = "/api/porn3dx";

export const getPorn3dxList = async (page = 1, search = "", tag = "") => {
  const params = { page };
  if (search) params.search = search;
  if (tag) params.tag = tag;
  const res = await axios.get(`${API_BASE}/list`, { params });
  return res.data;
};

export const getPorn3dxDetail = async (slug) => {
  const res = await axios.get(`${API_BASE}/detail/${slug}`);
  return res.data;
};
