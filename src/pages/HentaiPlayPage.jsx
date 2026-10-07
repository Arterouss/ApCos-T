import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

const HENTAI_TAGS = filterBlockedTags([
  { label: "Semua", value: "" },
  { label: "👙 Milf", value: "milf" },
  { label: "💕 Gyaru", value: "gyaru" },
  { label: "🏫 Schoolgirl", value: "schoolgirl" },
  { label: "😈 Netorare (NTR)", value: "netorare" },
  { label: "🌸 Harem", value: "harem" },
  { label: "👩‍❤️‍👩 Yuri", value: "yuri" },
  { label: "✨ Vanilla", value: "vanilla" },
  { label: "🐙 Tentacles", value: "tentacles" },
  { label: "🧝 Elf", value: "elf" },
  { label: "👩‍🏫 Teacher", value: "teacher" },
  { label: "🧙 Mind Control", value: "mind control" },
  { label: "👗 Maid", value: "maid" },
  { label: "😏 Ahegao", value: "ahegao" },
  { label: "🎭 Cosplay", value: "cosplay" },
  { label: "🧊 3D Animation", value: "3d" },
  { label: "🔓 Uncensored", value: "uncensored" },
]);

export default function HentaiPlayPage({ onOpenSidebar }) {
  const navigate = useNavigate();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = usePersistentState("hentaiplay_page", 1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = usePersistentState("hentaiplay_search", "");
  const [searchInput, setSearchInput] = useState(search);
  const [activeTag, setActiveTag] = useState(() => search || "");

  useScrollRestoration("hentaiplay");

  const fetchVideos = useCallback(async (pageNum, searchQuery) => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const data = await getHentaiPlayList(pageNum, searchQuery);
      const rawList = data.videos || [];
      setVideos(filterBlockedItems(rawList));
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError("Gagal memuat video. Coba lagi beberapa saat lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(page, search);
  }, [page, search, fetchVideos]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
    setActiveTag(searchInput);
  };

  const handleTagClick = (tagValue) => {
    if (activeTag.toLowerCase() === tagValue.toLowerCase()) {
      setActiveTag("");
      setSearch("");
      setSearchInput("");
    } else {
      setActiveTag(tagValue);
      setSearch(tagValue);
      setSearchInput(tagValue);
    }
    setPage(1);
  };

  const handleReset = () => {
    setActiveTag("");
    setSearch("");
    setSearchInput("");
    setPage(1);
  };

  const spotlightVideo = !search && page === 1 && videos.length > 0 ? videos[0] : null;
  const gridVideos = spotlightVideo ? videos.slice(1) : videos;

  return (
    <div className="min-h-screen text-white pt-6 md:pt-10 px-4 sm:px-6 md:px-8 pb-24 relative overflow-hidden bg-[#07070b]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── HEADER TITLE & SEARCH ─────────────────────────────────── */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(255, 45, 85, 0.1)',
                color: '#ff2d55',
                border: '1px solid rgba(255, 45, 85, 0.3)',
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
              Koleksi Anime Hentai Sub English &amp; Indo kualitas 1080p dengan player cepat tanpa jeda iklan.
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
                placeholder="Cari anime, karakter, atau studio..."
                className="w-full pl-9 pr-20 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 45, 85, 0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
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
                    background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                    boxShadow: '0 2px 8px rgba(255, 45, 85, 0.4)',
                  }}
                >
                  Cari
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ── POPULAR TAGS FILTER BAR ────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Tag size={13} className="text-neon-red" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pilihan Tag &amp; Genre:
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {HENTAI_TAGS.map((t) => {
              const isActive = activeTag.toLowerCase() === t.value.toLowerCase();
              return (
                <button
                  key={t.label}
                  onClick={() => handleTagClick(t.value)}
                  className={`shrink-0 text-xs px-3.5 py-1.5 rounded-xl font-semibold transition-all duration-300 cursor-pointer ${
                    isActive ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isActive
                      ? '1px solid rgba(255, 45, 85, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive ? '0 0 15px rgba(255, 45, 85, 0.35)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVE FILTER BAR ──────────────────────────────────────── */}
        {(search || activeTag) && (
          <div
            className="mb-8 p-3.5 rounded-2xl flex items-center justify-between gap-4"
            style={{
              background: 'rgba(255, 45, 85, 0.06)',
              border: '1px solid rgba(255, 45, 85, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span className="text-neon-red font-bold">Filter Aktif:</span>
              <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-md border border-red-500/30 font-medium">
                &ldquo;{search || activeTag}&rdquo;
              </span>
              <span className="text-gray-500 hidden sm:inline">
                ({videos.length} anime ditemukan)
              </span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs text-neon-red hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <X size={13} /> Reset Filter
            </button>
          </div>
        )}

        {/* ── SPOTLIGHT TRENDING HERO ────────────────────────────────── */}
        {spotlightVideo && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} className="text-neon-red" />
              <span className="text-xs sm:text-sm font-display font-black uppercase tracking-wider text-neon-red">
                Trending Anime Hari Ini
              </span>
            </div>
            <div
              onClick={() => navigate(`/hentaiplay/video/${encodeURIComponent(spotlightVideo.slug)}`)}
              className="relative rounded-3xl overflow-hidden transition-all duration-400 group cursor-pointer"
              style={{
                background: 'rgba(14, 16, 26, 0.7)',
                border: '1px solid rgba(255, 45, 85, 0.25)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 45, 85, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.5)';
                e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 45px rgba(255, 45, 85, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.25)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 45, 85, 0.1)';
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
                        background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                        boxShadow: '0 2px 10px rgba(255, 45, 85, 0.4)',
                      }}
                    >
                      TOP TRENDING
                    </span>
                    {spotlightVideo.categories?.[0] && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-gray-200"
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {spotlightVideo.categories[0]}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Star size={10} className="fill-amber-400 text-amber-400" /> 1080p
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl md:text-4xl font-display font-black text-white tracking-tight line-clamp-1 group-hover:text-neon-red transition-colors">
                    {spotlightVideo.title}
                  </h2>

                  <p className="text-xs text-gray-300 line-clamp-2 hidden sm:block max-w-xl">
                    Streaming episode anime hentai pilihan dengan resolusi tinggi, audio jernih, dan pemutar video cepat.
                  </p>

                  <div className="pt-2">
                    <button
                      className="px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all group-hover:scale-105 active:scale-95 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                        boxShadow: '0 4px 20px rgba(255, 45, 85, 0.4)',
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

        {/* ── VIDEO GRID CONTENT ─────────────────────────────────────── */}
        {loading ? (
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
              background: 'rgba(18, 18, 28, 0.5)',
              border: '1px solid rgba(255, 45, 85, 0.2)',
            }}
          >
            <AlertCircle size={40} className="text-neon-red" />
            <p className="text-neon-red text-sm">{error}</p>
            <button
              onClick={() => fetchVideos(page, search)}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-colors cursor-pointer"
              style={{ background: '#ff2d55' }}
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {videos.length === 0 ? (
              <div
                className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
                style={{
                  background: 'rgba(18, 18, 28, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
                  <Film size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Tidak Ada Video</h3>
                <p className="text-xs text-gray-400">
                  Tidak ditemukan anime dengan kata kunci atau tag &ldquo;{search}&rdquo;. Coba tag lain.
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
                      className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
                      style={{
                        background: 'rgba(14, 16, 26, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.4)';
                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 45, 85, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Thumbnail Image */}
                      <div className="relative aspect-video overflow-hidden bg-neutral-900">
                        {video.cover_url ? (
                          <img
                            src={video.cover_url}
                            alt={video.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}

                        <div className={`w-full h-full flex items-center justify-center bg-neutral-800 ${video.cover_url ? "hidden" : ""}`}>
                          <Film size={26} className="text-gray-600" />
                        </div>

                        {/* Category Badge */}
                        {video.categories?.length > 0 && (
                          <span
                            className="absolute top-2 left-2 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold shadow backdrop-blur-md"
                            style={{
                              background: 'rgba(0, 0, 0, 0.65)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          >
                            {video.categories[0]}
                          </span>
                        )}

                        {/* Hover Overlay with Play Button */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div
                            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg"
                            style={{
                              background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                              boxShadow: '0 0 20px rgba(255, 45, 85, 0.6)',
                            }}
                          >
                            <Play size={18} className="fill-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs sm:text-sm font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-neon-red transition-colors duration-200">
                          {video.title}
                        </p>

                        {video.categories?.length > 1 && (
                          <p className="text-[10px] text-gray-500 mt-2 line-clamp-1 font-mono">
                            {video.categories.slice(1, 3).join(" • ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* ── PAGINATION ─────────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-14">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <div
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm text-gray-300 font-mono"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  Halaman <span className="text-neon-red font-bold">{page}</span> / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
