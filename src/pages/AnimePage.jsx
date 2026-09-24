import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv,
  CheckCircle,
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Play,
  Menu,
} from "lucide-react";

const tabs = [
  { id: "ongoing", label: "Ongoing", icon: Tv },
  { id: "completed", label: "Completed", icon: CheckCircle },
];

// ── Anime Card ─────────────────────────────────────────────────────────
const AnimeCard = ({ anime, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay: index * 0.03 }}
  >
    <Link
      to={`/anime/detail/${anime.slug}`}
      className="group block rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:-translate-y-1"
    >
      {/* Poster */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%23111827' width='300' height='400'/%3E%3Ctext fill='%234B5563' x='150' y='200' text-anchor='middle' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Episode badge */}
        {anime.episode && (
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-cyan-500/90 backdrop-blur-sm text-[11px] font-bold text-white">
            {anime.episode}
          </div>
        )}

        {/* Day badge */}
        {anime.day && (
          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-violet-500/90 backdrop-blur-sm text-[11px] font-bold text-white flex items-center gap-1">
            <Calendar size={10} />
            {anime.day}
          </div>
        )}

        {/* Play overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-cyan-500/80 backdrop-blur-sm flex items-center justify-center">
            <Play size={24} className="text-white ml-1" fill="white" />
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white/90 line-clamp-2 group-hover:text-cyan-400 transition-colors">
          {anime.title}
        </h3>
      </div>
    </Link>
  </motion.div>
);

// ── Pagination ─────────────────────────────────────────────────────────
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
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-cyan-500/20 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
      </button>
      {getPageNumbers().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`min-w-[42px] h-[42px] rounded-xl font-semibold text-sm transition-all ${
            p === page
              ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30"
              : "bg-white/5 border border-white/10 text-white/70 hover:bg-cyan-500/20 hover:border-cyan-500/50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-cyan-500/20 hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
    <div className="min-h-screen pb-20">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Title row */}
          <div className="flex items-center gap-3 pt-4 pb-3">
            {onOpenSidebar && (
              <button
                onClick={onOpenSidebar}
                className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-cyan-400"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
                <Tv size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight">Nonton Anime</h1>
                <p className="text-xs text-white/40">Sub Indonesia • Otakudesu</p>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="pb-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari anime... (misal: Naruto, One Piece)"
                className="w-full pl-11 pr-24 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1.5">
                {isSearchMode && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs hover:bg-white/20 transition-all"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                >
                  Cari
                </button>
              </div>
            </div>
          </form>

          {/* Tabs (hidden during search) */}
          {!isSearchMode && (
            <div className="flex gap-1 pb-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-400 border border-cyan-500/40"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
        {/* Search mode heading */}
        {isSearchMode && (
          <div className="mb-6 flex items-center gap-2">
            <Search size={16} className="text-cyan-400" />
            <span className="text-white/60 text-sm">
              Hasil pencarian: <span className="text-cyan-400 font-semibold">"{searchQuery}"</span>
              {!loading && ` — ${animeList.length} ditemukan`}
            </span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
            <p className="text-white/40 text-sm">Memuat daftar anime...</p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-red-400 font-semibold mb-2">Gagal Memuat</p>
            <p className="text-white/40 text-sm mb-4">{error}</p>
            <button
              onClick={fetchAnime}
              className="px-6 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && animeList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32">
            <Tv size={48} className="text-white/20 mb-4" />
            <p className="text-white/40 text-sm">
              {isSearchMode ? "Tidak ada anime yang ditemukan." : "Belum ada anime tersedia."}
            </p>
          </div>
        )}

        {/* Anime grid */}
        {!loading && !error && animeList.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              <AnimatePresence mode="popLayout">
                {animeList.map((anime, i) => (
                  <AnimeCard key={anime.slug + "-" + i} anime={anime} index={i} />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination (not in search mode) */}
            {!isSearchMode && (
              <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
