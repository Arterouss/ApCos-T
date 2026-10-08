import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Trash2, Film, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";

export default function FavoritesPage({ onOpenSidebar }) {
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="min-h-screen text-white pt-6 md:pt-10 px-4 sm:px-6 md:px-8 pb-24 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(255, 45, 85, 0.1)',
                color: '#ff2d55',
                border: '1px solid rgba(255, 45, 85, 0.3)',
              }}
            >
              <Heart size={12} className="fill-current" />
              <span>Koleksi Tersimpan</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-red-500">
                Favorit Saya
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              Daftar video, anime, dan konten favorit yang Anda simpan untuk ditonton kembali kapan saja.
            </p>
          </div>

          <div
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-gray-300 self-start sm:self-auto"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            Total: <span className="text-neon-red font-bold">{favorites.length}</span> item
          </div>
        </div>

        {favorites.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-28 rounded-3xl max-w-md mx-auto text-center p-8"
            style={{
              background: 'rgba(14, 16, 26, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'rgba(255, 45, 85, 0.1)',
                border: '1px solid rgba(255, 45, 85, 0.25)',
              }}
            >
              <Heart size={32} className="text-neon-red opacity-60" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Belum Ada Favorit</h2>
            <p className="text-gray-400 text-xs mb-6">
              Tekan ikon hati di halaman anime atau video untuk menambahkannya ke koleksi favorit Anda.
            </p>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                boxShadow: '0 4px 20px rgba(255, 45, 85, 0.4)',
              }}
            >
              <span>Jelajahi Beranda</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {favorites.map((fav, i) => (
              <motion.div
                key={fav.id || fav.link || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass-card relative group rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10"
              >
                {/* Gambar / Cover */}
                <Link to={fav.link} className="block aspect-[3/4] relative overflow-hidden bg-neutral-900">
                  {fav.cover_url ? (
                    <img
                      src={fav.cover_url}
                      alt={fav.title}
                      className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                      <Film size={28} className="text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-black/30 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />
                </Link>

                {/* Hapus dari Favorit Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    removeFavorite(fav.id || fav.link);
                  }}
                  className="absolute top-2.5 right-2.5 p-2 rounded-xl text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                  title="Hapus dari Favorit"
                >
                  <Trash2 size={14} className="text-neon-red" />
                </button>

                {/* Info Label / Type */}
                <div
                  className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-bold text-gray-200 uppercase tracking-wider"
                  style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {fav.type || "Video"}
                </div>

                {/* Detail Judul */}
                <Link to={fav.link} className="absolute bottom-0 inset-x-0 p-3.5 pt-6 bg-gradient-to-t from-black via-black/85 to-transparent">
                  <p className="text-xs font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-neon-red transition-colors">
                    {fav.title || "Tanpa Judul"}
                  </p>
                  {fav.source && (
                    <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">{fav.source}</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
