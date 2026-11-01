import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Trash2,
  Film,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Search,
  X,
  ExternalLink,
  Book,
  Camera,
  Users,
  Tv,
} from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";

const CATEGORIES = [
  { id: "all", label: "Semua", icon: Sparkles },
  { id: "video", label: "Cinema & Video", icon: Film },
  { id: "manga", label: "Manga & Doujin", icon: Book },
  { id: "cosplay", label: "Cosplay & Foto", icon: Camera },
  { id: "creator", label: "Creator", icon: Users },
  { id: "anime", label: "Anime Series", icon: Tv },
];

export default function FavoritesPage({ onOpenSidebar }) {
  const { favorites, removeFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (fav.title || "").toLowerCase().includes(q);
        const matchType = (fav.type || "").toLowerCase().includes(q);
        const matchSource = (fav.source || "").toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchSource) return false;
      }

      // Filter by category
      if (activeCategory === "all") return true;

      const type = (fav.type || "").toLowerCase();
      const source = (fav.source || "").toLowerCase();

      if (activeCategory === "video") {
        return (
          type.includes("video") ||
          type.includes("jav") ||
          type.includes("hentai") ||
          type.includes("3d") ||
          source.includes("cavporn") ||
          source.includes("hentaiplay") ||
          source.includes("porn3dx") ||
          source.includes("jav.guru")
        );
      }

      if (activeCategory === "manga") {
        return (
          type.includes("manga") ||
          type.includes("doujin") ||
          type.includes("komik") ||
          source.includes("nhentai") ||
          source.includes("doujin")
        );
      }

      if (activeCategory === "cosplay") {
        return (
          type.includes("cosplay") ||
          type.includes("album") ||
          type.includes("foto") ||
          type.includes("r34 image") ||
          source.includes("cosplay") ||
          source.includes("balbums") ||
          source.includes("bunkr") ||
          source.includes("realbooru") ||
          source.includes("rule34")
        );
      }

      if (activeCategory === "creator") {
        return (
          type.includes("creator") ||
          source.includes("coomer") ||
          source.includes("pawchive") ||
          source.includes("kemono")
        );
      }

      if (activeCategory === "anime") {
        return type.includes("anime") || source.includes("anime");
      }

      return true;
    });
  }, [favorites, activeCategory, searchQuery]);

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
                background: "rgba(255, 45, 85, 0.1)",
                color: "#ff2d55",
                border: "1px solid rgba(255, 45, 85, 0.3)",
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
              Koleksi video, anime, cosplay, manga, dan creator favorit Anda yang disimpan di seluruh menu aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
            <div
              className="px-4 py-2 rounded-xl text-xs font-mono font-semibold text-gray-300"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              Total: <span className="text-neon-red font-bold">{favorites.length}</span> item
            </div>
          </div>
        </div>

        {/* Filter Controls (Search & Category Chips) */}
        {favorites.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500"
                          : "glass-card text-gray-300 hover:text-white border border-white/5 hover:border-white/20"
                      }`}
                    >
                      <Icon size={13} className={isActive ? "text-white" : "text-gray-400"} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari favorit..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Grid or Empty States */}
        {favorites.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-28 rounded-3xl max-w-md mx-auto text-center p-8"
            style={{
              background: "rgba(14, 16, 26, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(255, 45, 85, 0.1)",
                border: "1px solid rgba(255, 45, 85, 0.25)",
              }}
            >
              <Heart size={32} className="text-neon-red opacity-60" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Belum Ada Favorit</h2>
            <p className="text-gray-400 text-xs mb-6">
              Tekan ikon hati di halaman konten, video, cosplay, atau anime mana saja untuk menyimpannya ke koleksi Anda.
            </p>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
              style={{
                background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                boxShadow: "0 4px 20px rgba(255, 45, 85, 0.4)",
              }}
            >
              <span>Jelajahi Beranda</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-white/5 max-w-md mx-auto p-6">
            <Search size={32} className="text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Tidak Ditemukan</p>
            <p className="text-xs text-gray-400">Tidak ada favorit yang cocok dengan kata kunci atau filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            <AnimatePresence>
              {filteredFavorites.map((fav, i) => {
                const isExternal = fav.link && fav.link.startsWith("http");
                const CardWrapper = isExternal ? "a" : Link;
                const linkProps = isExternal
                  ? { href: fav.link, target: "_blank", rel: "noopener noreferrer" }
                  : { to: fav.link || "#" };

                return (
                  <motion.div
                    key={fav.id || fav.link || i}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card relative group rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10 flex flex-col"
                  >
                    {/* Media Cover */}
                    <CardWrapper
                      {...linkProps}
                      className="block aspect-[3/4] relative overflow-hidden bg-neutral-900"
                    >
                      {fav.cover_url ? (
                        <img
                          src={fav.cover_url}
                          alt={fav.title}
                          className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      {/* Fallback Icon */}
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 -z-0">
                        {fav.type?.toLowerCase().includes("manga") || fav.type?.toLowerCase().includes("doujin") ? (
                          <Book size={28} className="text-gray-700" />
                        ) : fav.type?.toLowerCase().includes("creator") ? (
                          <Users size={28} className="text-gray-700" />
                        ) : (
                          <Film size={28} className="text-gray-700" />
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-black/30 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />
                    </CardWrapper>

                    {/* Hapus dari Favorit Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeFavorite(fav.id || fav.link);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 rounded-xl text-gray-300 hover:text-white transition-all transform hover:scale-110 shadow-xl opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                      style={{
                        background: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      title="Hapus dari Favorit"
                    >
                      <Trash2 size={14} className="text-neon-red" />
                    </button>

                    {/* Info Label / Type */}
                    <div
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-bold text-gray-200 uppercase tracking-wider pointer-events-none"
                      style={{
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {fav.type || "Favorit"}
                    </div>

                    {/* Detail Judul */}
                    <CardWrapper
                      {...linkProps}
                      className="absolute bottom-0 inset-x-0 p-3.5 pt-6 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end"
                    >
                      <p className="text-xs font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-neon-red transition-colors">
                        {fav.title || "Tanpa Judul"}
                      </p>
                      {fav.source && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider flex items-center justify-between">
                          <span>{fav.source}</span>
                          {isExternal && <ExternalLink size={10} className="text-gray-500" />}
                        </p>
                      )}
                    </CardWrapper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
