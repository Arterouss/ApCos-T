import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Film,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Flame,
  Tag,
  X,
  Play,
  Star,
  Sparkles,
  TrendingUp,
  ArrowUpDown,
  Hash,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

// ── Tab Kategori Utama (Termasuk "Lagi Rame / Trending") ─────────────
const MAIN_TABS = [
  { label: "Lagi Rame", value: "trending", icon: Flame, badge: "HOT" },
  { label: "Terbaru", value: "", icon: Sparkles },
  { label: "Tanpa Sensor", value: "uncensored", icon: Star },
  { label: "English Sub", value: "english-subbed", icon: Film },
  { label: "3D Animation", value: "3d", icon: Sparkles },
];

// ── Tagar / Hashtags Populer Hentai ─────────────────────────────────
const ALL_TAGS = filterBlockedTags([
  { label: "NTR", value: "ntr", color: "red" },
  { label: "Gyaru", value: "gyaru", color: "pink" },
  { label: "Milf", value: "milf", color: "orange" },
  { label: "School Girls", value: "school-girls", color: "blue" },
  { label: "Harem", value: "harem", color: "purple" },
  { label: "Ahegao", value: "ahegao", color: "pink" },
  { label: "Yuri", value: "yuri", color: "rose" },
  { label: "Vanilla", value: "vanilla", color: "amber" },
  { label: "Large Breasts", value: "large-breasts", color: "orange" },
  { label: "Housewife", value: "housewife", color: "purple" },
  { label: "Office Ladies", value: "office-ladies", color: "indigo" },
  { label: "Tentacles", value: "tentacles", color: "green" },
  { label: "Fantasy", value: "fantasy", color: "teal" },
  { label: "Romance", value: "romance", color: "pink" },
  { label: "Anal", value: "anal", color: "red" },
  { label: "Virgins", value: "virgins", color: "rose" },
  { label: "Teacher", value: "teacher", color: "indigo" },
  { label: "Maid", value: "maid", color: "blue" },
  { label: "Mind Control", value: "mind-control", color: "purple" },
  { label: "Cosplay", value: "cosplay", color: "amber" },
  { label: "3D Animation", value: "3d", color: "cyan" },
  { label: "Uncensored", value: "uncensored", color: "amber" },
]);

export default function HentaiPlayPage({ onOpenSidebar }) {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States: Category Tab, Active Tagar, Search Input, Sort
  const [activeCategory, setActiveCategory] = usePersistentState("hp_category", "trending");
  const [activeTag, setActiveTag] = usePersistentState("hp_tag", "");
  const [sortBy, setSortBy] = usePersistentState("hp_sort", "default");
  const [tagSearchInput, setTagSearchInput] = useState("");
  const [page, setPage] = usePersistentState("hentaiplay_page", 1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = usePersistentState("hentaiplay_search", "");
  const [searchInput, setSearchInput] = useState(search);

  useScrollRestoration("hentaiplay");

  // Fetch videos from backend
  const fetchVideos = useCallback(async (pageNum, searchQuery, cat, tag) => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      // Prioritize active tagar over category if tagar is selected
      const effectiveCategory = tag || cat || "";
      const data = await getHentaiPlayList(pageNum, searchQuery, effectiveCategory);
      const rawList = data.videos || [];
      setVideos(filterBlockedItems(rawList));
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError("Gagal memuat video Hentai. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(page, search, activeCategory, activeTag);
  }, [page, search, activeCategory, activeTag, fetchVideos]);

  // Handle Search Input submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setActiveTag("");
    setSearch(searchInput.trim());
  };

  // Handle Category Tab click
  const handleCategoryClick = (catVal) => {
    setActiveCategory(catVal);
    setActiveTag("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  // Handle Tagar click (toggle on/off)
  const handleTagClick = (tagVal) => {
    if (activeTag === tagVal) {
      setActiveTag("");
    } else {
      setActiveTag(tagVal);
      setSearch("");
      setSearchInput("");
    }
    setPage(1);
  };

  // Handle Reset Filter
  const handleReset = () => {
    setActiveCategory("trending");
    setActiveTag("");
    setSearch("");
    setSearchInput("");
    setSortBy("default");
    setPage(1);
  };

  // Filtered tags list by tagSearchInput
  const filteredTags = useMemo(() => {
    if (!tagSearchInput.trim()) return ALL_TAGS;
    const q = tagSearchInput.toLowerCase().trim();
    return ALL_TAGS.filter(
      (t) => t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q)
    );
  }, [tagSearchInput]);

  // Sorted videos according to sortBy
  const sortedVideos = useMemo(() => {
    if (!videos || videos.length === 0) return [];
    const list = [...videos];
    if (sortBy === "title_asc") {
      return list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    if (sortBy === "title_desc") {
      return list.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }
    return list;
  }, [videos, sortBy]);

  const spotlightVideo =
    activeCategory === "trending" && !activeTag && !search && page === 1 && sortedVideos.length > 0
      ? sortedVideos[0]
      : null;
  const gridVideos = spotlightVideo ? sortedVideos.slice(1) : sortedVideos;

  return (
    <div className="min-h-screen text-white pt-6 md:pt-10 px-4 sm:px-6 md:px-8 pb-24 relative overflow-hidden bg-[#07070b]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.07] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* ── HEADER TITLE & SEARCH ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2.5"
              style={{
                background: "rgba(255, 45, 85, 0.12)",
                color: "#ff2d55",
                border: "1px solid rgba(255, 45, 85, 0.3)",
              }}
            >
              <Flame size={12} className="animate-pulse" />
              <span>HentaiPlay Cinema HD</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-500 to-pink-500">
                HentaiPlay
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              Koleksi Anime Hentai &amp; 3D Animation terlengkap. Putar episode cepat dengan kualitas Full HD 1080p.
            </p>
          </div>

          <form onSubmit={handleSearch} className="w-full md:w-80">
            <div className="relative group">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-red transition-colors"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari anime, karakter, atau judul..."
                className="w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 45, 85, 0.5)";
                  e.currentTarget.style.boxShadow = "0 0 15px rgba(255, 45, 85, 0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                    boxShadow: "0 2px 8px rgba(255, 45, 85, 0.4)",
                  }}
                >
                  Cari
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── 1. TAB KATEGORI UTAMA & LAGI RAME ───────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 max-w-full">
            {MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCategory === tab.value && !activeTag && !search;
              return (
                <button
                  key={tab.label}
                  onClick={() => handleCategoryClick(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "text-white shadow-lg shadow-red-500/30 scale-[1.02]"
                      : "text-gray-400 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #ff2d55, #ff6b35)"
                      : undefined,
                    border: isActive
                      ? "1px solid rgba(255, 45, 85, 0.6)"
                      : undefined,
                  }}
                >
                  <Icon size={15} className={isActive ? "text-white" : "text-gray-400"} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-black/40 text-yellow-300 border border-yellow-300/30">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <ArrowUpDown size={13} /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-black/60 border border-white/10 text-gray-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="default">Rilis / Default</option>
              <option value="title_asc">Nama (A - Z)</option>
              <option value="title_desc">Nama (Z - A)</option>
            </select>
          </div>
        </div>

        {/* ── 2. FILTER TAGAR / HASHTAGS INTERAKTIF ─────────────────── */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
              <Hash size={14} className="text-neon-red" />
              <span>Filter Berdasarkan Tagar (#Hashtag):</span>
              {activeTag && (
                <span className="text-[10px] text-neon-red bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  #{activeTag} Aktif
                </span>
              )}
            </div>

            {/* Live Tagar Search Box */}
            <div className="relative w-full sm:w-64">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Cari tagar cepat... (ntr, milf, gyaru)"
                value={tagSearchInput}
                onChange={(e) => setTagSearchInput(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white/[0.04] border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-all"
              />
              {tagSearchInput && (
                <button
                  onClick={() => setTagSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Tagar Chips */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 max-h-36 overflow-y-auto scrollbar-thin">
            {filteredTags.length > 0 ? (
              filteredTags.map((t) => {
                const isSelected = activeTag.toLowerCase() === t.value.toLowerCase();
                return (
                  <button
                    key={t.value}
                    onClick={() => handleTagClick(t.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/40 scale-105"
                        : "bg-white/[0.03] border-white/10 text-gray-300 hover:border-red-500/50 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>#{t.label}</span>
                    {isSelected && <Check size={12} className="text-white" />}
                  </button>
                );
              })
            ) : (
              <p className="text-gray-500 text-xs italic py-1">
                Tidak ada tagar yang cocok dengan "{tagSearchInput}".
              </p>
            )}
          </div>
        </div>

        {/* ── 3. ACTIVE FILTER NOTIFICATION & RESET ─────────────────── */}
        {(activeTag || search || activeCategory !== "trending" || sortBy !== "default") && (
          <div
            className="p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3"
            style={{
              background: "rgba(255, 45, 85, 0.08)",
              border: "1px solid rgba(255, 45, 85, 0.25)",
            }}
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-200">
              <span className="text-neon-red font-bold">Filter Diterapkan:</span>
              {activeTag && (
                <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 font-semibold flex items-center gap-1">
                  Tagar: #{activeTag}
                  <button onClick={() => setActiveTag("")} className="hover:text-white">
                    <X size={11} />
                  </button>
                </span>
              )}
              {search && (
                <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 font-semibold flex items-center gap-1">
                  Cari: &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch("")} className="hover:text-white">
                    <X size={11} />
                  </button>
                </span>
              )}
              {activeCategory && activeCategory !== "trending" && (
                <span className="bg-white/10 text-gray-300 px-2.5 py-0.5 rounded-full border border-white/15 font-semibold">
                  Kategori: {MAIN_TABS.find((t) => t.value === activeCategory)?.label || activeCategory}
                </span>
              )}
              <span className="text-gray-400">
                ({sortedVideos.length} anime ditemukan)
              </span>
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-neon-red hover:text-white font-bold px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/30 border border-red-500/20 transition-all cursor-pointer"
            >
              <X size={13} /> Reset Semua Filter
            </button>
          </div>
        )}

        {/* ── 4. SPOTLIGHT HERO: LAGI RAME (TRENDING ANIME) ─────────── */}
        {spotlightVideo && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-neon-red animate-bounce" />
              <span className="text-xs sm:text-sm font-display font-black uppercase tracking-wider text-neon-red">
                Sedang Tren &amp; Paling Banyak Ditonton Hari Ini
              </span>
            </div>
            <div
              onClick={() => navigate(`/hentaiplay/video/${encodeURIComponent(spotlightVideo.slug)}`)}
              className="relative rounded-3xl overflow-hidden transition-all duration-400 group cursor-pointer"
              style={{
                background: "rgba(14, 16, 26, 0.7)",
                border: "1px solid rgba(255, 45, 85, 0.25)",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 45, 85, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 45, 85, 0.5)";
                e.currentTarget.style.boxShadow =
                  "0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(255, 45, 85, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255, 45, 85, 0.25)";
                e.currentTarget.style.boxShadow =
                  "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 45, 85, 0.1)";
              }}
            >
              <div className="relative aspect-[16/8] sm:aspect-[21/9] max-h-[380px] overflow-hidden bg-black/70">
                {spotlightVideo.cover_url ? (
                  <img
                    src={spotlightVideo.cover_url}
                    alt={spotlightVideo.title}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-90"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                    <Film size={48} className="text-gray-700" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-[#07070b]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#07070b] via-[#07070b]/60 to-transparent w-full sm:w-2/3" />

                {/* Spotlight Info */}
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 z-10 space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-black px-2.5 py-0.5 rounded-lg text-white uppercase tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                        boxShadow: "0 2px 10px rgba(255, 45, 85, 0.4)",
                      }}
                    >
                      🔥 NOMOR 1 LAGI RAME
                    </span>
                    {spotlightVideo.categories?.[0] && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-gray-200"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        #{spotlightVideo.categories[0]}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> Full HD
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight line-clamp-1 group-hover:text-neon-red transition-colors">
                    {spotlightVideo.title}
                  </h2>

                  <p className="text-xs text-gray-300 line-clamp-2 hidden sm:block max-w-xl">
                    Streaming episode anime hentai pilihan dengan resolusi tinggi, audio jernih, dan pemutar video instan.
                  </p>

                  <div className="pt-2">
                    <button
                      className="px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all group-hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                        boxShadow: "0 4px 20px rgba(255, 45, 85, 0.4)",
                      }}
                    >
                      <Play size={15} className="fill-white" />
                      <span>Putar Episode Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. VIDEO GRID CONTENT ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-2.5 overflow-hidden flex flex-col gap-3"
                style={{
                  background: "rgba(14, 16, 26, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                <div className="aspect-video rounded-xl bg-white/[0.04] relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
                <div className="h-4 bg-white/[0.05] rounded-md w-4/5 animate-pulse" />
                <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
            style={{
              background: "rgba(18, 18, 28, 0.5)",
              border: "1px solid rgba(255, 45, 85, 0.2)",
            }}
          >
            <AlertCircle size={40} className="text-neon-red" />
            <p className="text-neon-red text-sm">{error}</p>
            <button
              onClick={() => fetchVideos(page, search, activeCategory, activeTag)}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer"
              style={{ background: "#ff2d55" }}
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {gridVideos.length === 0 ? (
              <div
                className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
                style={{
                  background: "rgba(18, 18, 28, 0.5)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
                  <Film size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Tidak Ada Video</h3>
                <p className="text-xs text-gray-400">
                  Tidak ditemukan anime dengan filter ini. Coba pilih tagar atau kategori yang lain.
                </p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neon-red bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  Kembali ke Semua Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                {gridVideos.map((video, i) => (
                  <motion.div
                    key={video.id || video.slug || i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.25 }}
                  >
                    <Link
                      to={`/hentaiplay/video/${encodeURIComponent(video.slug)}`}
                      className="glass-card group flex flex-col h-full rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10"
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-video overflow-hidden bg-neutral-900">
                        {video.cover_url ? (
                          <img
                            src={video.cover_url}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}

                        <div
                          className={`w-full h-full flex items-center justify-center bg-neutral-800 ${
                            video.cover_url ? "hidden" : ""
                          }`}
                        >
                          <Film size={26} className="text-gray-600" />
                        </div>

                        {/* Category Tag Badge */}
                        {video.categories?.length > 0 && (
                          <span
                            className="absolute top-2 left-2 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold shadow backdrop-blur-md"
                            style={{
                              background: "rgba(0, 0, 0, 0.65)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            #{video.categories[0]}
                          </span>
                        )}

                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play size={16} className="fill-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Video Info */}
                      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                        <h3 className="text-xs font-bold text-gray-200 group-hover:text-neon-red line-clamp-2 transition-colors">
                          {video.title}
                        </h3>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-white/5 pt-2">
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            HD 1080p
                          </span>
                          <span className="text-gray-500 hover:text-white transition-colors">
                            Tonton &rarr;
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── 6. PAGINATION ───────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 pt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 text-xs">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                    let pageNum = page;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (page <= 3) {
                      pageNum = idx + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = page - 2 + idx;
                    }

                    const isCurrent = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30"
                            : "bg-white/[0.04] border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.08]"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
