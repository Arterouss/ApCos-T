import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Camera,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
  Zap,
  Sparkles,
  ArrowRight,
  Menu,
} from "lucide-react";
import { getFapelloList } from "../services/fapelloService";

const SORT_OPTIONS = [
  { key: "trending", label: "Trending", icon: <TrendingUp size={13} /> },
  { key: "new", label: "Terbaru", icon: <Zap size={13} /> },
  { key: "top", label: "Top Disukai", icon: <Star size={13} /> },
];

const FapelloCard = ({ item, onClick }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-rose-500/50 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/30 hover:-translate-y-1 flex flex-col justify-between"
      onClick={() => onClick(item)}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-900">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-rose-400 animate-spin" size={22} />
          </div>
        )}
        {!imgError && item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
            <Camera className="text-gray-600" size={36} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Hover pill */}
        <div className="absolute bottom-2.5 inset-x-2.5 p-2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
            Lihat Model <ArrowRight size={12} />
          </span>
          {item.followers && (
            <span className="text-[10px] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-gray-300 border border-white/10">
              {item.followers}
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="text-white text-xs sm:text-sm font-bold line-clamp-1 group-hover:text-rose-300 transition-colors">
          {item.name}
        </p>
        {item.followers && (
          <p className="text-gray-400 text-[11px] mt-0.5 font-medium">
            {item.followers} pengikut
          </p>
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
      setError(
        "Gagal memuat konten Fapello. " + (e.response?.data?.error || e.message)
      );
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
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-rose-400" /> Fapello Network
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                Fapello <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">Models</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Koleksi model, selebgram, dan creator terpopuler di platform Fapello.
              </p>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="w-full md:w-80">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Cari nama model..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-rose-500/50 text-white text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-full placeholder-gray-500 focus:outline-none transition-all"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Sort Tabs */}
          <div className="relative z-10 flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  setSort(opt.key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-bold transition-all duration-300 ${
                  sort === opt.key
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500"
                    : "glass-card text-gray-400 hover:text-white hover:border-rose-500/30 border border-white/10"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          {search && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-gray-400 text-xs sm:text-sm">
                Hasil pencarian untuk: <strong className="text-rose-400">"{search}"</strong>
              </span>
              <button
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 underline font-medium"
              >
                Reset Filter
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
              <p className="text-xs text-rose-300 font-semibold tracking-widest uppercase">
                Memuat Model Fapello...
              </p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center rounded-3xl border border-rose-500/30 max-w-md mx-auto my-12">
              <p className="text-rose-400 text-sm mb-4">{error}</p>
              <button
                onClick={fetchData}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl text-gray-500 text-sm max-w-md mx-auto my-12">
              Tidak ada model yang ditemukan.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <FapelloCard
                      key={item.id || i}
                      item={item}
                      onClick={handleCardClick}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 pt-10 pb-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2.5 glass-card hover:border-rose-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md"
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span className="text-xs font-bold text-rose-300 px-4 py-2 glass-card rounded-full border border-rose-500/30">
                  Halaman {page}
                </span>
                <button
                  disabled={items.length === 0}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2.5 glass-card hover:border-rose-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md"
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
