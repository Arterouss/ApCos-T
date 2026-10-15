import axios from 'axios';

const API_BASE = '/api/realbooru';

export const getRealbooruPosts = async ({ tags = '', page = 1 } = {}) => {
  const params = { page };
  if (tags) params.tags = tags;
  const res = await axios.get(`${API_BASE}/posts`, { params });
  return res.data;
};

export const getRealbooruPost = async (id) => {
  const res = await axios.get(`${API_BASE}/post/${encodeURIComponent(id)}`);
  return res.data;
};

export const getRealbooruTags = async (search = '') => {
  const params = {};
  if (search) params.search = search;
  const res = await axios.get(`${API_BASE}/tags`, { params });
  return res.data;
};

export const getRealbooruMediaProxyUrl = (url) => {
  if (!url) return '';
  return `${API_BASE}/media?url=${encodeURIComponent(url)}`;
};
