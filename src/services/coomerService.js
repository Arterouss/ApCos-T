import axios from "axios";

const API_BASE = "/api/coomer";

export const getCoomerCreators = async (page = 1, service = "", search = "", limit = 40) => {
  const params = { page, limit };
  if (service && service !== "all") params.service = service;
  if (search) params.search = search;

  const res = await axios.get(`${API_BASE}/creators`, { params });
  return res.data;
};

export const getCoomerPosts = async (offset = 0) => {
  const res = await axios.get(`${API_BASE}/posts`, { params: { offset } });
  return res.data;
};

export const getCoomerCreatorPosts = async (service, id, offset = 0) => {
  const res = await axios.get(`${API_BASE}/creator/${encodeURIComponent(service)}/${encodeURIComponent(id)}/posts`, {
    params: { offset },
  });
  return res.data;
};

export const getCoomerCreatorProfile = async (service, id) => {
  const res = await axios.get(`${API_BASE}/creator/${encodeURIComponent(service)}/${encodeURIComponent(id)}/profile`);
  return res.data;
};
