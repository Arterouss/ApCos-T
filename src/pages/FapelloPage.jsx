import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Camera, Loader2, ChevronLeft, ChevronRight, TrendingUp, Star, Zap } from "lucide-react";
import { getFapelloList } from "../services/fapelloService";

const SORT_OPTIONS = [
  { key: "trending", label: "Trending", icon: <TrendingUp size={14} /> },
  { key: "new", label: "Terbaru", icon: <Zap size={14} /> },
  { key: "top", label: "Top Likes", icon: <Star size={14} /> },
];

const FapelloCard = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-rose-500/40 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-rose-900/20"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-800">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-rose-400 animate-spin" size={24} />
          </div>
        )}
        {!imgError && item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Camera className="text-gray-600" size={40} />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {/* Name on hover */}
        <div className="absolute bottom-0 inset-x-0 p-3 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <p className="text-white text-sm font-semibold">{item.name}</p>
          {item.followers && <p className="text-gray-300 text-xs">{item.followers}</p>}
        </div>
      </div>
      <div className="p-3">
        <p className="text-white text-sm font-semibold line-clamp-1">{item.name}</p>
        {item.followers && (
          <p className="text-gray-500 text-xs mt-0.5">{item.followers}</p>
        )}
      </div>
    </motion.div>
  );
};

export default function FapelloPage({ onOpenSidebar }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFapelloList(page, search, sort);
      setItems(data || []);
    } catch (e) {
      setError("Gagal memuat konten Fapello. " + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleCardClick = (item) => {
    navigate(`/fapello/${encodeURIComponent(item.slug)}`);
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Camera size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Fapello</h1>
              <p className="text-gray-500 text-xs">Cosplay & Model Gallery</p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Cari model..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm pl-9 pr-9 py-2 rounded-xl placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
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

        {/* Sort Options */}
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setSort(opt.key); setPage(1); }}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                sort === opt.key
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-900/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {search && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-gray-400 text-sm">Hasil pencarian: "{search}"</span>
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X size={12} /> Reset
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={40} className="text-rose-400 animate-spin" />
            <p className="text-gray-500 text-sm">Memuat model dari Fapello...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="text-4xl">😵</div>
            <p className="text-red-400 text-sm text-center max-w-md">{error}</p>
            <button onClick={fetchData} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-xl">
              Coba Lagi
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="text-4xl">🔍</div>
                <p className="text-gray-500 text-sm">Tidak ada model ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <FapelloCard key={item.id || i} item={item} onClick={handleCardClick} />
                  ))}
                </AnimatePresence>
              </div>
            )}

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
