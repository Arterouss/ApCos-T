import axios from "axios";

const API_BASE = "/api/balbums";

export const getBalbumsAlbums = async ({
  page = 1,
  search = "",
  sort = "latest",
  per = 20,
  mode = "broad",
} = {}) => {
  const params = { page, per, sort, mode };
  if (search) params.search = search;

  const res = await axios.get(`${API_BASE}/albums`, { params });
  return res.data;
};

export const getBalbumsAlbumDetail = async (albumId) => {
  const res = await axios.get(`${API_BASE}/album/${encodeURIComponent(albumId)}`);
  return res.data;
};

export const getBalbumsFileDirect = async (fileId) => {
  const res = await axios.get(`${API_BASE}/file/${encodeURIComponent(fileId)}`);
  return res.data;
};

export const getBalbumsMediaProxyUrl = (url) => {
  if (!url) return "";
  return `${API_BASE}/media?url=${encodeURIComponent(url)}`;
};
