import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  Menu,
  Sparkles,
  Flame,
  X,
} from "lucide-react";

const tabs = [
  { id: "ongoing", label: "Anime Ongoing", icon: Tv, color: "text-neon-cyan" },
  { id: "completed", label: "Anime Tamat", icon: CheckCircle2, color: "text-neon-purple" },
];

// ── Anime Card with Cyber-Luxe Glass ──────────────────────────────────
const AnimeCard = ({ anime, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
  >
    <Link
      to={`/anime/detail/${anime.slug}`}
      className="glass-card group flex flex-col h-full rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10 relative"
    >
      {/* Poster */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%230f1016' width='300' height='400'/%3E%3Ctext fill='%234B5563' x='150' y='200' text-anchor='middle' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090f] via-transparent to-black/30 opacity-90" />

        {/* Episode badge */}
        {anime.episode && (
          <div
            className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-black uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #00e5ff, #40c4ff)',
              boxShadow: '0 2px 10px rgba(0, 229, 255, 0.4)',
            }}
          >
            {anime.episode}
          </div>
        )}

        {/* Day badge */}
        {anime.day && (
          <div
            className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1"
            style={{
              background: 'rgba(124, 77, 255, 0.8)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(124, 77, 255, 0.3)',
            }}
          >
            <Calendar size={10} />
            <span>{anime.day}</span>
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300"
            style={{
              background: '#00e5ff',
              boxShadow: '0 0 25px rgba(0, 229, 255, 0.6)',
            }}
          >
            <Play size={20} className="text-black ml-0.5 fill-black" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-200 line-clamp-2 group-hover:text-neon-cyan transition-colors duration-200 leading-snug">
          {anime.title}
        </h3>
        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-500">
          <span className="font-mono">Otakudesu</span>
          <span className="text-neon-cyan/70 font-semibold group-hover:text-neon-cyan">Stream</span>
        </div>
      </div>
    </Link>
  </motion.div>
);

// ── Pagination with Cyber-Luxe Glass ──────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12 mb-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2.5 rounded-xl font-medium text-xs sm:text-sm text-gray-300 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        aria-label="Previous Page"
      >
        <ChevronLeft size={18} />
      </button>

      {getPageNumbers().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`min-w-[40px] h-[40px] rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center cursor-pointer ${
            p === page
              ? "text-black shadow-lg"
              : "text-gray-400 hover:text-white"
          }`}
          style={{
            background: p === page
              ? 'linear-gradient(135deg, #00e5ff, #7c4dff)'
              : 'rgba(255, 255, 255, 0.04)',
            border: p === page
              ? '1px solid rgba(0, 229, 255, 0.6)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: p === page ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none',
          }}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2.5 rounded-xl font-medium text-xs sm:text-sm text-gray-300 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        aria-label="Next Page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AnimePage({ onOpenSidebar }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "ongoing");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [animeList, setAnimeList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // ── Fetch anime list ─────────────────────────────────────────────────
  const fetchAnime = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (isSearchMode && searchQuery) {
        url = `/api/anime/search?q=${encodeURIComponent(searchQuery)}`;
      } else if (activeTab === "completed") {
        url = `/api/anime/completed?page=${page}`;
      } else {
        url = `/api/anime/ongoing?page=${page}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setAnimeList(data.animeList || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Fetch anime error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, isSearchMode, searchQuery]);

  useEffect(() => {
    fetchAnime();
  }, [fetchAnime]);

  // ── Handle tab switch ────────────────────────────────────────────────
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
    setIsSearchMode(false);
    setSearchQuery("");
    setSearchInput("");
    setSearchParams({ tab: tabId, page: 1 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Handle pagination ────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSearchParams({ tab: activeTab, page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Handle search ────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setIsSearchMode(true);
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const clearSearch = () => {
    setIsSearchMode(false);
    setSearchQuery("");
    setSearchInput("");
    setPage(1);
  };

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#07080f]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-500/[0.06] blur-[150px]" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-violet-600/[0.05] blur-[160px]" />
      </div>

      <div className="relative z-10">
        {/* ── Sticky Modern Header ────────────────────────────────────── */}
        <div
          className="sticky top-0 z-30 transition-all duration-300 px-4 sm:px-6 md:px-8 py-4"
          style={{
            background: 'rgba(7, 8, 15, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Branding & Portal Badge */}
            <div className="flex items-center gap-3">
              {onOpenSidebar && (
                <button
                  onClick={onOpenSidebar}
                  className="md:hidden p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white hover:text-neon-cyan transition-colors cursor-pointer"
                  aria-label="Open Sidebar"
                >
                  <Menu size={18} />
                </button>
              )}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(124, 77, 255, 0.2))',
                  border: '1px solid rgba(0, 229, 255, 0.3)',
                }}
              >
                <Tv size={20} className="text-neon-cyan" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-display font-black tracking-tight text-white">
                    Otakudesu Anime
                  </h1>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                    style={{
                      background: 'rgba(0, 229, 255, 0.1)',
                      color: '#00e5ff',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                    }}
                  >
                    SUB INDO
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Streaming Anime HD kualitas 360p, 480p &amp; 720p
                </p>
              </div>
            </div>

            {/* Right: Search Box */}
            <form onSubmit={handleSearch} className="w-full md:w-80">
              <div className="relative group">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-cyan transition-colors"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari judul anime..."
                  className="w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 229, 255, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isSearchMode && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-black transition-all cursor-pointer"
                    style={{
                      background: '#00e5ff',
                      boxShadow: '0 2px 8px rgba(0, 229, 255, 0.3)',
                    }}
                  >
                    Cari
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Mode Tabs (when not searching) */}
          {!isSearchMode && (
            <div className="max-w-7xl mx-auto flex gap-2 mt-4 overflow-x-auto scrollbar-none pt-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      isActive ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(124, 77, 255, 0.15))'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isActive
                        ? '1px solid rgba(0, 229, 255, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.04)',
                      boxShadow: isActive ? '0 0 20px rgba(0, 229, 255, 0.15)' : 'none',
                    }}
                  >
                    <Icon size={15} className={isActive ? "text-neon-cyan" : "text-gray-500"} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main Content Area ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {/* Search Result Banner */}
          {isSearchMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl flex items-center justify-between gap-4"
              style={{
                background: 'rgba(0, 229, 255, 0.05)',
                border: '1px solid rgba(0, 229, 255, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
                <Search size={16} className="text-neon-cyan shrink-0" />
                <span>
                  Hasil pencarian untuk:{" "}
                  <strong className="text-neon-cyan">&ldquo;{searchQuery}&rdquo;</strong>
                </span>
                {!loading && (
                  <span className="text-gray-500 font-mono text-xs">
                    ({animeList.length} anime ditemukan)
                  </span>
                )}
              </div>
              <button
                onClick={clearSearch}
                className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] transition-all cursor-pointer"
              >
                Reset
              </button>
            </motion.div>
          )}

          {/* Loading Skeletons */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-2.5 overflow-hidden flex flex-col gap-3"
                  style={{
                    background: 'rgba(12, 14, 24, 0.5)',
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

          {/* Error State */}
          {error && !loading && (
            <div
              className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
              style={{
                background: 'rgba(18, 18, 28, 0.5)',
                border: '1px solid rgba(255, 45, 85, 0.2)',
              }}
            >
              <AlertCircle size={40} className="text-neon-red" />
              <h2 className="text-lg font-bold text-white">Gagal Memuat Anime</h2>
              <p className="text-gray-400 text-xs">{error}</p>
              <button
                onClick={fetchAnime}
                className="px-5 py-2 rounded-xl text-xs font-bold text-black transition-all cursor-pointer"
                style={{ background: '#00e5ff' }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && animeList.length === 0 && (
            <div
              className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
              style={{
                background: 'rgba(18, 18, 28, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
                <Tv size={28} />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isSearchMode ? "Anime Tidak Ditemukan" : "Belum Ada Anime Tersedia"}
              </h3>
              <p className="text-gray-400 text-xs">
                {isSearchMode
                  ? "Coba gunakan kata kunci lain seperti Naruto, One Piece, atau Bleach."
                  : "Silakan periksa kembali beberapa saat lagi."}
              </p>
              {isSearchMode && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neon-cyan bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all cursor-pointer"
                >
                  Kembali ke Daftar Utama
                </button>
              )}
            </div>
          )}

          {/* Anime Grid */}
          {!loading && !error && animeList.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                <AnimatePresence mode="popLayout">
                  {animeList.map((anime, i) => (
                    <AnimeCard key={anime.slug + "-" + i} anime={anime} index={i} />
                  ))}
                </AnimatePresence>
              </div>

              {!isSearchMode && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
