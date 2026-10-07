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
  Play,
  Flame,
  Sparkles,
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: 'rgba(14, 16, 26, 0.6)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(168, 85, 247, 0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onClick={() => onClick(item)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] bg-neutral-900 overflow-hidden">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 animate-pulse">
            <Film size={24} className="text-gray-700" />
          </div>
        )}
        {imgError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-gray-600">
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
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-108 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-transparent to-transparent opacity-75 group-hover:opacity-40 transition-opacity" />

        {/* Type Badge */}
        <div
          className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg border text-white"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {item.type === "video" ? (
            <>
              <Film size={10} className="text-neon-purple" />
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
          <div
            className="absolute top-2.5 right-2.5 text-white text-[9px] px-1.5 py-0.5 rounded-md font-mono"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {item.duration}
          </div>
        )}

        {/* Views */}
        {item.views && (
          <div
            className="absolute bottom-2.5 right-2.5 text-gray-300 text-[9px] flex items-center gap-1 px-1.5 py-0.5 rounded font-mono"
            style={{ background: 'rgba(0, 0, 0, 0.65)' }}
          >
            <span>👁 {item.views}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-200 line-clamp-2 group-hover:text-neon-purple transition-colors leading-snug">
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
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-10 px-4 sm:px-6 md:px-8 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-violet-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <Sparkles size={12} />
              <span>3D &amp; SFM Community</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">
                Porn3dx
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              Koleksi animasi 3D, Blender, Overwatch, dan SFM kualitas tinggi.
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-80">
            <div className="relative group">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-purple transition-colors"
              />
              <input
                type="text"
                placeholder="Cari konten 3D..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                    className="p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  Cari
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── Tag Chips ──────────────────────────────────────────────── */}
        <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {TAGS.map((tag) => {
            const isActive = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-300 cursor-pointer ${
                  isActive ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isActive
                    ? '1px solid rgba(168, 85, 247, 0.8)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: isActive ? '0 0 15px rgba(168, 85, 247, 0.35)' : 'none',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* ── Status Bar ─────────────────────────────────────────────── */}
        {(search || activeTag) && (
          <div
            className="mb-8 p-3.5 rounded-2xl flex items-center justify-between gap-4"
            style={{
              background: 'rgba(168, 85, 247, 0.06)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-neon-purple font-bold">Filter Aktif:</span>
              <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-md border border-purple-500/30 font-medium">
                {search ? `Pencarian: "${search}"` : `Tag: "${activeTag}"`}
              </span>
            </div>
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setActiveTag(""); setPage(1); }}
              className="flex items-center gap-1 text-xs text-neon-purple hover:text-purple-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-purple-500/10 transition-colors cursor-pointer"
            >
              <X size={13} /> Reset Filter
            </button>
          </div>
        )}

        {/* ── Content / Skeletons ─────────────────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-2.5 overflow-hidden flex flex-col gap-3"
                style={{
                  background: 'rgba(14, 16, 26, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div className="aspect-[3/4] rounded-xl bg-white/[0.04] relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
                <div className="h-4 bg-white/[0.05] rounded-md w-4/5 animate-pulse" />
                <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {/* Maintenance Alert */}
        {!loading && error && isMaintenance && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto my-12 rounded-3xl p-6 sm:p-8 text-center"
            style={{
              background: 'rgba(18, 18, 28, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
              <Wrench size={30} className="animate-pulse" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <AlertTriangle size={12} /> Server Pusat Sedang Maintenance
            </div>

            <h2 className="text-xl sm:text-2xl font-display font-black text-white mb-2 tracking-tight">
              Porn3dx Sedang Dalam Pemeliharaan
            </h2>

            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed mb-6 max-w-lg mx-auto">
              Website sumber resmi <strong className="text-white">porn3dx.com</strong> saat ini sedang offline untuk pembaruan fitur &amp; server oleh pengelola aslinya. Konten animasi 3D akan otomatis muncul kembali begitu maintenance selesai.
            </p>

            <button
              onClick={fetchData}
              className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              <RefreshCw size={15} />
              <span>Cek Ulang Status Server</span>
            </button>
          </motion.div>
        )}

        {/* Regular Error */}
        {!loading && error && !isMaintenance && (
          <div
            className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
            style={{
              background: 'rgba(18, 18, 28, 0.5)',
              border: '1px solid rgba(255, 45, 85, 0.2)',
            }}
          >
            <AlertTriangle size={40} className="text-neon-red" />
            <p className="text-neon-red text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer"
              style={{ background: '#ff2d55' }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid Content */}
        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <div
                className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto"
                style={{
                  background: 'rgba(14, 16, 26, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <p className="text-gray-400 text-sm">Tidak ada konten ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
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
            {items.length > 0 && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-14">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <div
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm text-gray-300 font-mono"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  Halaman <span className="text-neon-purple font-bold">{page}</span>
                </div>
                <button
                  disabled={items.length === 0}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Berikutnya <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
