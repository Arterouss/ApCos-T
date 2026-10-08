import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getDoujinList } from "../services/doujinService";
import { Book, Search, X, ChevronDown, ChevronUp, Tag, AlertTriangle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

// ── All available genre/tag chips ────────────────────────────────────────
const ALL_TAGS = filterBlockedTags([
  { label: "🔥 NTR",        value: "ntr",         color: "red"    },
  { label: "💕 Gyaru",      value: "gyaru",        color: "pink"   },
  { label: "👙 Milf",       value: "milf",         color: "orange" },
  { label: "🏫 School",     value: "school",       color: "blue"   },
  { label: "⛪ Nun",        value: "nun",          color: "purple" },
  { label: "🧝 Fantasy",   value: "fantasy",       color: "indigo" },
  { label: "🌸 Romance",   value: "romance",       color: "pink"   },
  { label: "😂 Comedy",    value: "comedy",        color: "yellow" },
  { label: "🗡️ Action",    value: "action",        color: "red"    },
  { label: "🌍 Isekai",    value: "isekai",        color: "green"  },
  { label: "💘 Harem",     value: "harem",         color: "pink"   },
  { label: "😏 Ecchi",     value: "ecchi",         color: "orange" },
  { label: "👨‍👩‍👧 Incest",  value: "incest",        color: "purple" },
  { label: "🐙 Tentacles", value: "tentacles",     color: "green"  },
  { label: "🎀 Ahegao",    value: "ahegao",        color: "pink"   },
  { label: "👩‍❤️‍👩 Yuri",   value: "yuri",          color: "rose"   },
  { label: "📖 Drama",     value: "drama",         color: "blue"   },
  { label: "🏠 Slice of Life", value: "slice-of-life", color: "teal" },
  { label: "🤺 Adventure", value: "adventure",     color: "amber"  },
  { label: "🔞 Anal",      value: "anal",          color: "orange" },
  { label: "🩺 Nurse",     value: "nurse",         color: "blue"   },
  { label: "👮 Police",    value: "police",        color: "indigo" },
  { label: "🧙 Magic",     value: "magic",         color: "purple" },
  { label: "🤖 Mecha",     value: "mecha",         color: "gray"   },
  { label: "🐱 Kemonomimi", value: "kemonomimi",   color: "amber"  },
  { label: "🦄 Monster Girl", value: "monster-girl", color: "green" },
  { label: "😴 Somnophilia", value: "somnophilia", color: "indigo" },
  { label: "🔗 BDSM",      value: "bdsm",          color: "red"    },
]);

const INITIAL_SHOW = 14;

export default function DoujinPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [activeGenre, setActiveGenre] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);
  const [error, setError] = useState(null);
  const tagInputRef = useRef(null);

  // Debounce main text search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTags = tagSearch.trim()
    ? ALL_TAGS.filter(t =>
        t.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.value.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : showAllTags ? ALL_TAGS : ALL_TAGS.slice(0, INITIAL_SHOW);

  const fetchData = React.useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const results = await getDoujinList(pageNum, activeType, activeGenre, debouncedQuery);
      setData(filterBlockedItems(results || []));
    } catch (err) {
      console.error("Failed to load Doujin data", err);
      setError("Gagal menghubungkan ke server Doujin. Kemungkinan terhalang proteksi server.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [activeType, activeGenre, debouncedQuery]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [debouncedQuery, activeType, activeGenre, fetchData]);

  const handleTagClick = (tagValue) => {
    setActiveGenre(prev => prev === tagValue ? "" : tagValue);
    setTagSearch("");
  };

  const handleClearFilter = () => {
    setActiveType("");
    setActiveGenre("");
    setSearchQuery("");
    setTagSearch("");
  };

  const getSubtitle = () => {
    if (debouncedQuery) return `Pencarian: "${debouncedQuery}"`;
    if (activeGenre) {
      const tag = ALL_TAGS.find(t => t.value === activeGenre);
      return `Tag: ${tag ? tag.label : activeGenre}`;
    }
    if (activeType === "doujin") return "Koleksi Doujinshi & Manga Terlengkap";
    if (activeType === "manhwa") return "Koleksi Manhwa Full Color";
    if (activeType === "all") return "Semua Komik & Manga";
    return "Jelajahi Doujinshi, Manga & Manhwa Sub Indo";
  };

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-10 px-4 sm:px-6 md:px-8 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(124, 77, 255, 0.1)',
                color: '#a855f7',
                border: '1px solid rgba(124, 77, 255, 0.3)',
              }}
            >
              <Book size={12} />
              <span>DoujinDesu Reader</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                Doujin Desu
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              {getSubtitle()}
            </p>
          </div>

          {/* Search Bar + Type Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Text Search */}
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari judul manga..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type tabs */}
            <div
              className="flex p-1 rounded-xl shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {[
                { label: "Trending", value: "" },
                { label: "Semua", value: "all" },
                { label: "Manga", value: "doujin" },
                { label: "Manhwa", value: "manhwa" },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setActiveType(t.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    activeType === t.value ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    background: activeType === t.value
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : 'transparent',
                    boxShadow: activeType === t.value ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tag / Genre section ───────────────────────────────────────── */}
        <div
          className="mb-8 p-5 rounded-2xl"
          style={{
            background: 'rgba(14, 16, 26, 0.6)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-neon-purple" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Filter Tag &amp; Genre
              </span>
              {activeGenre && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(124, 77, 255, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(124, 77, 255, 0.4)',
                  }}
                >
                  Aktif: {ALL_TAGS.find(t => t.value === activeGenre)?.label || activeGenre}
                </span>
              )}
            </div>
            {(activeGenre || activeType || searchQuery) && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 text-xs text-neon-red hover:text-red-300 transition-colors font-semibold cursor-pointer"
              >
                <X size={13} /> Reset Filter
              </button>
            )}
          </div>

          {/* Tag search input */}
          <div className="relative mb-3.5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              ref={tagInputRef}
              type="text"
              placeholder="Cari tag genre... (contoh: gyaru, milf, school, ntr)"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            />
            {tagSearch && (
              <button
                onClick={() => setTagSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap gap-2">
            {filteredTags.length > 0 ? filteredTags.map(tag => {
              const isActive = activeGenre === tag.value;
              return (
                <button
                  key={tag.value}
                  onClick={() => handleTagClick(tag.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isActive
                      ? '1px solid rgba(168, 85, 247, 0.8)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isActive ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none',
                  }}
                >
                  {tag.label}
                </button>
              );
            }) : (
              <p className="text-gray-500 text-xs italic">Tag tidak ditemukan untuk "{tagSearch}"</p>
            )}
          </div>

          {/* Show more / less */}
          {!tagSearch && ALL_TAGS.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllTags(s => !s)}
              className="mt-3.5 flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 transition-colors font-medium cursor-pointer"
            >
              {showAllTags
                ? <><ChevronUp size={13} /> Sembunyikan Sebagian</>
                : <><ChevronDown size={13} /> Tampilkan Semua ({ALL_TAGS.length}) Tag</>
              }
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div
            className="my-10 p-8 rounded-3xl flex flex-col justify-center items-center text-center max-w-md mx-auto"
            style={{
              background: 'rgba(18, 18, 28, 0.6)',
              border: '1px solid rgba(255, 45, 85, 0.25)',
            }}
          >
            <AlertTriangle size={44} className="text-neon-red mb-3" />
            <h3 className="text-base font-bold text-white mb-2">Gagal Menghubungkan ke Server</h3>
            <p className="text-gray-400 text-xs mb-5">{error}</p>
            <button
              onClick={() => fetchData(page)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              style={{ background: '#ff2d55' }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid Content / Skeletons */}
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
                <div className="aspect-[3/4] rounded-xl bg-white/[0.04] relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
                <div className="h-4 bg-white/[0.05] rounded-md w-4/5 animate-pulse" />
                <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : !error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
              {data.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  to={`/doujin/${item.slug}`}
                  className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    background: 'rgba(14, 16, 26, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-transparent to-transparent opacity-75" />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end">
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-black/80 border border-white/10"
                      >
                        {item.type}
                      </span>
                      {item.latest_chapter && (
                        <span
                          className="text-[9px] font-mono text-gray-300 px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
                        >
                          {item.latest_chapter}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-xs sm:text-sm text-gray-200 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="mt-14 flex justify-center items-center gap-3">
                <button
                  onClick={() => {
                    const newPage = Math.max(1, page - 1);
                    setPage(newPage);
                    fetchData(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-gray-300 hover:text-white"
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
                  Halaman <span className="text-indigo-400 font-bold">{page}</span>
                </div>
                <button
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchData(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-gray-300 hover:text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}

            {data.length === 0 && (
              <div
                className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto"
                style={{
                  background: 'rgba(14, 16, 26, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <p className="text-gray-400 text-sm">Tidak ada komik yang ditemukan.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
