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
  TrendingUp
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
    if (activeTag === tagValue) {
      // Toggle off
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

  // Video trending sorotan (ambil item pertama jika di halaman 1 dan tanpa search)
  const spotlightVideo = !search && page === 1 && videos.length > 0 ? videos[0] : null;
  const gridVideos = spotlightVideo ? videos.slice(1) : videos;

  return (
    <div className="min-h-screen text-white pt-6 md:pt-14 px-3.5 sm:px-6 md:px-8 pb-24 bg-[#070709]">
      {/* ── HEADER TITLE & BADGE ────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Film size={22} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                HentaiPlay Cinema
              </h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/40 tracking-wider">
                HD ANIME
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Koleksi Anime Hentai Sub English & Indo kualitas tinggi — Diperbarui setiap hari
            </p>
          </div>
        </div>

        {/* ── SEARCH INPUT FORM ─────────────────────────────────────────────── */}
        <form onSubmit={handleSearch} className="mt-5 flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul anime, nama karakter, atau studio..."
              className="w-full pl-10 pr-10 py-3 bg-[#0f0f14] border border-white/10 hover:border-red-500/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30 transition-all shadow-inner"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>
      </div>

      {/* ── POPULAR TAGS FILTER BAR ────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Tag size={13} className="text-red-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Jelajahi Berdasarkan Tag / Genre:
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {HENTAI_TAGS.map((t) => {
            const isActive = activeTag.toLowerCase() === t.value.toLowerCase();
            return (
              <button
                key={t.label}
                onClick={() => handleTagClick(t.value)}
                className={`shrink-0 text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-200 border cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/30 border-red-500 scale-105 font-bold"
                    : "bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/[0.09] border-white/10 hover:border-white/20"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE FILTER BAR ──────────────────────────────────────────────── */}
      {(search || activeTag) && (
        <div className="mb-6 p-3 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="text-red-400 font-bold">Filter Aktif:</span>
            <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded-md border border-red-500/30 font-medium">
              &ldquo;{search || activeTag}&rdquo;
            </span>
            <span className="text-gray-500 hidden sm:inline">
              (Menampilkan {videos.length} anime)
            </span>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <X size={13} /> Reset Filter
          </button>
        </div>
      )}

      {/* ── SPOTLIGHT TRENDING HERO (Hanya tampil di halaman 1 saat browsing) ── */}
      {spotlightVideo && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={18} className="text-red-500" />
            <span className="text-sm font-black uppercase tracking-wider text-red-400">
              Trending Anime Minggu Ini
            </span>
          </div>
          <div
            onClick={() => navigate(`/hentaiplay/video/${encodeURIComponent(spotlightVideo.slug)}`)}
            className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-red-500/50 shadow-2xl transition-all duration-300 group cursor-pointer"
          >
            <div className="relative aspect-[16/8] sm:aspect-[21/9] max-h-[360px] overflow-hidden bg-black/60">
              {spotlightVideo.cover_url ? (
                <img
                  src={spotlightVideo.cover_url}
                  alt={spotlightVideo.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                  <Film size={48} className="text-gray-700" />
                </div>
              )}

              {/* Gradient Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent w-full sm:w-2/3" />

              {/* Spotlight Info */}
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 z-10 space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-wider shadow">
                    🔥 TOP TRENDING
                  </span>
                  {spotlightVideo.categories?.[0] && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/15 text-gray-200 border border-white/10 backdrop-blur-md">
                      {spotlightVideo.categories[0]}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star size={10} className="fill-amber-400 text-amber-400" /> 1080p
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight line-clamp-1 group-hover:text-red-400 transition-colors">
                  {spotlightVideo.title}
                </h2>

                <p className="text-xs text-gray-300 line-clamp-1 hidden sm:block">
                  Klik untuk langsung memutar episode anime ini dalam pemutar video bawaan tanpa iklan.
                </p>

                <div className="pt-1">
                  <button className="px-4 py-2 rounded-xl bg-red-600 group-hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-600/40 transition-all">
                    <Play size={15} className="fill-white" /> Putar Episode Sekarang
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIDEO GRID CONTENT ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="text-red-500 animate-spin" />
          <p className="text-gray-400 text-sm animate-pulse">
            Sedang memuat koleksi anime HentaiPlay...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => fetchVideos(page, search)}
            className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {videos.length === 0 ? (
            <div className="text-center py-28 space-y-3">
              <div className="text-4xl">🔍</div>
              <h3 className="text-lg font-bold text-white">Tidak ada video ditemukan</h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Tidak ada anime yang cocok dengan kata kunci atau tag &ldquo;{search}&rdquo;. Coba tag lain seperti Milf, Gyaru, atau Schoolgirl.
              </p>
              <button
                onClick={handleReset}
                className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                Kembali ke Semua Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
              {gridVideos.map((video, i) => (
                <motion.div
                  key={video.id || video.slug || i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.25 }}
                  whileHover={{ y: -4 }}
                >
                  <Link
                    to={`/hentaiplay/video/${encodeURIComponent(video.slug)}`}
                    className="group flex flex-col h-full rounded-xl overflow-hidden bg-[#0e0e13] border border-white/5 hover:border-red-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-950/30"
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

                      {/* Top Category Badge */}
                      {video.categories?.length > 0 && (
                        <span className="absolute top-2 left-2 bg-red-600/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow backdrop-blur-sm">
                          {video.categories[0]}
                        </span>
                      )}

                      {/* Hover Overlay with Play Button */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                          <Play size={18} className="fill-white translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <p className="text-xs sm:text-sm font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-red-400 transition-colors duration-200">
                        {video.title}
                      </p>

                      {video.categories?.length > 1 && (
                        <p className="text-[10px] text-gray-500 mt-2 line-clamp-1">
                          {video.categories.slice(1, 3).join(" • ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* ── PAGINATION ─────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 sm:gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all border border-white/5"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <div className="px-4 py-2 bg-white/[0.04] border border-white/10 rounded-xl text-xs sm:text-sm text-gray-300 font-mono">
                Hal <span className="text-red-400 font-bold">{page}</span> / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-all border border-white/5"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
