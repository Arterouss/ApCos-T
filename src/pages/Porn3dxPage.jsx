import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Film, Image, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { getPorn3dxList } from "../services/porn3dxService";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";

const TAGS = [
  "3d porn", "blender", "anime", "big tits", "ass", "hentai", "game porn",
  "overwatch", "futanari", "sfm", "mmd", "fortnite", "naruto", "ahegao",
  "lesbian", "creampie", "cumshot", "facial", "milf", "teen"
];

const Porn3dxCard = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-violet-500/40 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-violet-900/20"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-video overflow-hidden bg-gray-800">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-violet-400 animate-spin" size={24} />
          </div>
        )}
        {!imgError ? (
          <img
            src={item.cover_url}
            alt={item.title}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Film className="text-gray-600" size={40} />
          </div>
        )}
        {/* Type Badge */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.type === "video" ? (
            <span className="bg-violet-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Film size={10} /> VIDEO
            </span>
          ) : (
            <span className="bg-rose-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <Image size={10} /> IMAGE
            </span>
          )}
        </div>
        {/* Duration */}
        {item.duration && (
          <div className="absolute bottom-2 right-2">
            <span className="bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
              {item.duration}
            </span>
          </div>
        )}
        {/* Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
          {item.title || "Unknown"}
        </p>
        {item.views && (
          <p className="text-gray-500 text-xs mt-1">{item.views} views</p>
        )}
      </div>
    </motion.div>
  );
};

export default function Porn3dxPage({ onOpenSidebar }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = usePersistentState("porn3dx_search", "");
  const [searchInput, setSearchInput] = useState(search);
  const [activeTag, setActiveTag] = usePersistentState("porn3dx_tag", "");
  const [page, setPage] = usePersistentState("porn3dx_page", 1);

  useScrollRestoration("porn3dx");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPorn3dxList(page, search, activeTag);
      setItems(data || []);
    } catch (e) {
      setError("Gagal memuat konten Porn3dx. " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTag]);

  useEffect(() => {
    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setActiveTag("");
    setPage(1);
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      setActiveTag("");
    } else {
      setActiveTag(tag);
      setSearch("");
      setSearchInput("");
    }
    setPage(1);
  };

  const handleCardClick = (item) => {
    navigate(`/porn3dx/${encodeURIComponent(item.slug)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2.5 bg-white/5 border border-white/10 rounded-xl text-white"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
              <Film size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Porn3dx</h1>
              <p className="text-gray-500 text-xs">3D & Game Porn Community</p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Cari konten..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm pl-9 pr-9 py-2 rounded-xl placeholder-gray-500 focus:outline-none focus:border-violet-500/50"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tag Chips */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                activeTag === tag
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Status Bar */}
        {(search || activeTag) && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-gray-400 text-sm">
              {search ? `Hasil pencarian: "${search}"` : `Tag: "${activeTag}"`}
            </span>
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setActiveTag(""); setPage(1); }}
              className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
            >
              <X size={12} /> Reset
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={40} className="text-violet-400 animate-spin" />
            <p className="text-gray-500 text-sm">Memuat konten dari Porn3dx...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-4xl">😵</div>
            <p className="text-red-400 text-sm text-center max-w-md">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="text-4xl">🔍</div>
                <p className="text-gray-500 text-sm">Tidak ada konten ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <Porn3dxCard
                      key={item.id || i}
                      item={item}
                      onClick={handleCardClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-sm disabled:opacity-40 hover:bg-white/10 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <span className="text-gray-400 text-sm">Halaman {page}</span>
              <button
                disabled={items.length === 0}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white text-sm disabled:opacity-40 hover:bg-white/10 disabled:cursor-not-allowed transition-all"
              >
                Berikutnya <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
