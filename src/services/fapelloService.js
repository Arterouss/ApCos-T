import axios from "axios";

/**
 * Mengambil daftar model Fapello (trending, new, top-likes, atau search)
 */
export const getFapelloList = async (page = 1, search = "", sort = "trending") => {
  const params = new URLSearchParams();
  if (page) params.set("page", page);
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);

  const res = await axios.get(`/api/fapello/list?${params.toString()}`);
  if (res.data?.success) {
    return res.data.models || [];
  }
  return [];
};

/**
 * Mengambil detail profil dan postingan media model Fapello
 */
export const getFapelloModel = async (slug) => {
  const cleanSlug = String(slug).replace(/^\/+|\/+$/g, "");
  const res = await axios.get(`/api/fapello/model/${encodeURIComponent(cleanSlug)}`);
  if (res.data?.success) {
    return res.data.data;
  }
  throw new Error(res.data?.error || "Gagal memuat profil model.");
};
