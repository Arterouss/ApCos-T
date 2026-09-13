const API_BASE = "/api/hentaiplay";

export const getHentaiPlayList = async (page = 1, search = '') => {
  const params = new URLSearchParams({ page });
  if (search) params.set('search', search);
  const res = await fetch(`${API_BASE}/list?${params.toString()}`);
  if (!res.ok) throw new Error("Gagal mengambil daftar video HentaiPlay");
  return res.json();
};

export const getHentaiPlayVideo = async (slug) => {
  const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
  const res = await fetch(`${API_BASE}/video/${encodeURIComponent(cleanSlug)}`);
  if (!res.ok) throw new Error("Gagal mengambil detail video HentaiPlay");
  return res.json();
};
