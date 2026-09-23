import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  X, 
  Film, 
  Image, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Wrench,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Play
} from "lucide-react";
import { getPorn3dxList } from "../services/porn3dxService";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

const TAGS = filterBlockedTags([
  "3d porn", "blender", "anime", "big tits", "ass", "hentai", "game porn",
  "overwatch", "futanari", "sfm", "mmd", "fortnite", "naruto", "ahegao",
  "lesbian", "creampie", "cumshot", "facial", "milf", "teen"
]);

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
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 animate-pulse">
            <Film size={24} className="text-gray-600" />
          </div>
        )}
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-800 text-gray-500">
            <Film size={28} className="mb-1" />
            <span className="text-[10px]">No Preview</span>
          </div>
        ) : (
          <img
            src={item.cover_url}
            alt={item.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Type Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10">
          {item.type === "video" ? (
            <>
              <Film size={10} className="text-violet-400" />
              <span>Video</span>
            </>
          ) : (
            <>
              <Image size={10} className="text-pink-400" />
              <span>Image</span>
            </>
          )}
        </div>

        {/* Duration Badge */}
        {item.duration && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
            {item.duration}
          </div>
        )}

        {/* Views */}
        {item.views && (
          <div className="absolute bottom-2 right-2 text-gray-400 text-[10px] flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded">
            <span>👁 {item.views}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-xs font-semibold text-gray-200 line-clamp-2 group-hover:text-violet-300 transition-colors leading-snug">
          {item.title}
        </h3>
      </div>
    </motion.div>
  );
};

export default function Porn3dxPage({ onOpenSidebar }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [search, setSearch] = usePersistentState("porn3dx_search", "");
  const [searchInput, setSearchInput] = useState(search);
  const [activeTag, setActiveTag] = usePersistentState("porn3dx_tag", "");
  const [page, setPage] = usePersistentState("porn3dx_page", 1);

  useScrollRestoration("porn3dx");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsMaintenance(false);
    try {
      const data = await getPorn3dxList(page, search, activeTag);
      setItems(filterBlockedItems(Array.isArray(data) ? data : data?.items || []));
    } catch (e) {
      const isMaint = e.response?.data?.isMaintenance || e.response?.status === 503 || e.message?.includes("MAINTENANCE");
      setIsMaintenance(isMaint);
      setError(e.response?.data?.error || e.message || "Gagal memuat konten Porn3dx.");
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

        {/* Error / Maintenance */}
        {!loading && error && (
          isMaintenance ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto my-12 bg-neutral-900/90 border border-amber-500/20 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-amber-500/5 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
                <Wrench size={32} className="animate-pulse" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <AlertTriangle size={12} /> Server Pusat Sedang Maintenance
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                Porn3dx Sedang Dalam Pemeliharaan
              </h2>

              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-lg mx-auto">
                Website sumber resmi <strong className="text-white">porn3dx.com</strong> saat ini sedang offline untuk pembaruan fitur & server oleh pengelola aslinya (Status HTTP 503). Konten animasi 3D akan otomatis muncul kembali begitu maintenance dari pihak Porn3dx selesai.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <button
                  onClick={fetchData}
                  className="w-full sm:w-auto px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-600/30"
                >
                  <RefreshCw size={15} />
                  <span>Cek Ulang Status Server</span>
                </button>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-xs text-gray-500 mb-3 font-medium">Sementara itu, Anda dapat menikmati alternatif video & 3D lainnya:</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => navigate("/rule34")}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-gray-300 hover:text-white text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Film size={13} className="text-violet-400" />
                    <span>Rule34 Video (3D & SFM)</span>
                    <ArrowRight size={11} className="text-gray-500" />
                  </button>
                  <button
                    onClick={() => navigate("/hentaiplay")}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/30 text-gray-300 hover:text-white text-xs rounded-xl transition-all flex items-center gap-1.5 active:scale-95"
                  >
                    <Play size={13} className="text-rose-400" />
                    <span>HentaiPlay (Anime Series)</span>
                    <ArrowRight size={11} className="text-gray-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="text-4xl">😵</div>
              <p className="text-red-400 text-sm max-w-md">{error}</p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-xl transition-all active:scale-95"
              >
                Coba Lagi
              </button>
            </div>
          )
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
