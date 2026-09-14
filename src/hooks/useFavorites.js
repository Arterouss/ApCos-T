import { useState, useEffect } from "react";

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  // Muat data dari localStorage saat hook pertama kali dipanggil
  useEffect(() => {
    try {
      const stored = localStorage.getItem("apicos_favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Gagal memuat favorit:", e);
    }
  }, []);

  // Simpan ke localStorage setiap kali state favorites berubah
  useEffect(() => {
    try {
      localStorage.setItem("apicos_favorites", JSON.stringify(favorites));
    } catch (e) {
      console.error("Gagal menyimpan favorit:", e);
    }
  }, [favorites]);

  const addFavorite = (item) => {
    setFavorites((prev) => {
      // Cek apakah sudah ada (mencegah duplikat berdasarkan ID atau Link URL aslinya)
      const isExist = prev.find((f) => f.id === item.id || f.link === item.link);
      if (isExist) return prev;
      return [item, ...prev]; // Tambahkan di urutan teratas
    });
  };

  const removeFavorite = (idOrLink) => {
    setFavorites((prev) => prev.filter((f) => f.id !== idOrLink && f.link !== idOrLink));
  };

  const isFavorite = (idOrLink) => {
    return favorites.some((f) => f.id === idOrLink || f.link === idOrLink);
  };

  const toggleFavorite = (item) => {
    if (isFavorite(item.id || item.link)) {
      removeFavorite(item.id || item.link);
    } else {
      addFavorite(item);
    }
  };

  return { favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite };
}
