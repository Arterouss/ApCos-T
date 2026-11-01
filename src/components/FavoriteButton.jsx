import React from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";

export default function FavoriteButton({
  item,
  size = 18,
  variant = "icon", // "icon" | "card" | "detail" | "banner"
  showText = false,
  className = "",
}) {
  const { isFavorite, toggleFavorite } = useFavorites();
  if (!item) return null;

  const key = item.id || item.link;
  const active = isFavorite(key);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item);
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
        title={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
        className={`p-2 rounded-xl backdrop-blur-md transition-all duration-200 cursor-pointer z-10 ${
          active
            ? "bg-rose-600/90 text-white shadow-lg shadow-rose-600/40 border border-rose-500/80 scale-105"
            : "bg-black/60 hover:bg-black/85 text-gray-300 hover:text-white border border-white/10 hover:border-rose-500/40"
        } ${className}`}
      >
        <Heart size={size} className={active ? "fill-white" : ""} />
      </button>
    );
  }

  if (variant === "banner" || variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
        title={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer shrink-0 shadow-lg ${
          active
            ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white border border-rose-500 shadow-rose-600/40 scale-102"
            : "glass-card text-gray-300 hover:text-white border border-white/10 hover:border-rose-500/40"
        } ${className}`}
      >
        <Heart size={size} className={active ? "fill-white" : ""} />
        {showText && <span>{active ? "Tersimpan di Favorit" : "Simpan ke Favorit"}</span>}
      </button>
    );
  }

  // Default "icon"
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
      title={active ? "Hapus dari Favorit" : "Simpan ke Favorit"}
      className={`p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
        active
          ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/40 border border-rose-500"
          : "glass-card text-gray-400 hover:text-white border border-white/10 hover:border-rose-500/40"
      } ${className}`}
    >
      <Heart size={size} className={active ? "fill-white" : ""} />
    </button>
  );
}
