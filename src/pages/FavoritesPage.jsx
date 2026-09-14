import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, Film, Image as ImageIcon } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";

export default function FavoritesPage({ onOpenSidebar }) {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Favorit Saya</h1>
            <p className="text-xs text-gray-500">Koleksi video dan foto yang Anda simpan</p>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-4">
          <Heart size={48} className="text-gray-700" />
          <p>Belum ada favorit yang disimpan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favorites.map((fav, i) => (
            <motion.div
              key={fav.id || fav.link || i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="relative group rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-rose-500/30 transition-all shadow-lg"
            >
              {/* Gambar / Cover */}
              <Link to={fav.link} className="block aspect-[4/5] sm:aspect-video relative overflow-hidden bg-neutral-800">
                {fav.cover_url ? (
                  <img
                    src={fav.cover_url}
                    alt={fav.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                    <Film size={28} className="text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>

              {/* Hapus dari Favorit Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFavorite(fav.id || fav.link);
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/60 hover:bg-rose-600 backdrop-blur-sm text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-xl opacity-0 group-hover:opacity-100"
                title="Hapus dari Favorit"
              >
                <Trash2 size={16} />
              </button>
              
              {/* Info Label / Type */}
              <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                {fav.type || "Video"}
              </div>

              {/* Detail Judul */}
              <Link to={fav.link} className="absolute bottom-0 inset-x-0 p-3 pt-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                <p className="text-xs font-semibold text-gray-200 line-clamp-2 leading-tight group-hover:text-rose-400 transition-colors">
                  {fav.title || "Tanpa Judul"}
                </p>
                {fav.source && (
                  <p className="text-[10px] text-gray-500 mt-1 uppercase">{fav.source}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
