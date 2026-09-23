import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { getDoujinList } from "../services/doujinService";
import { Book, Search, X, ChevronDown, ChevronUp, Tag, AlertTriangle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

// ── All available genre/tag chips ────────────────────────────────────────
const ALL_TAGS = filterBlockedTags([
  // Type
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

const TAG_COLORS = {
  red:    "bg-red-600/20 border-red-500/40 text-red-300 hover:bg-red-600/40",
  pink:   "bg-pink-600/20 border-pink-500/40 text-pink-300 hover:bg-pink-600/40",
  orange: "bg-orange-600/20 border-orange-500/40 text-orange-300 hover:bg-orange-600/40",
  blue:   "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/40",
  purple: "bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/40",
  indigo: "bg-indigo-600/20 border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/40",
  yellow: "bg-yellow-600/20 border-yellow-500/40 text-yellow-300 hover:bg-yellow-600/40",
  green:  "bg-green-600/20 border-green-500/40 text-green-300 hover:bg-green-600/40",
  teal:   "bg-teal-600/20 border-teal-500/40 text-teal-300 hover:bg-teal-600/40",
  rose:   "bg-rose-600/20 border-rose-500/40 text-rose-300 hover:bg-rose-600/40",
  amber:  "bg-amber-600/20 border-amber-500/40 text-amber-300 hover:bg-amber-600/40",
  gray:   "bg-gray-600/20 border-gray-500/40 text-gray-300 hover:bg-gray-600/40",
};

const TAG_COLORS_ACTIVE = {
  red:    "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/30",
  pink:   "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/30",
  orange: "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/30",
  blue:   "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30",
  purple: "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30",
  indigo: "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30",
  yellow: "bg-yellow-500 border-yellow-400 text-black shadow-lg shadow-yellow-500/30",
  green:  "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/30",
  teal:   "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/30",
  rose:   "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/30",
  amber:  "bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30",
  gray:   "bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/30",
};

// Initial tags to show (rest hidden behind "Show More")
const INITIAL_SHOW = 12;


export default function DoujinPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [tagSearch,      setTagSearch]      = useState(""); // live tag search input
  const [activeType,     setActiveType]     = useState("");
  const [activeGenre,    setActiveGenre]    = useState("");
  const [showAllTags,    setShowAllTags]    = useState(false);
  const [error,          setError]          = useState(null);
  const tagInputRef = useRef(null);

  // Debounce main text search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter ALL_TAGS based on tagSearch input
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
      // API call to backend
      const results = await getDoujinList(pageNum, activeType, activeGenre, debouncedQuery);
      setData(filterBlockedItems(results || []));
    } catch (err) {
      console.error("Failed to load Doujin data", err);
      setError("Gagal menghubungkan ke server Doujin. Kemungkinan terhalang Cloudflare.");
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
    if (activeType === "doujin")  return "Koleksi Doujinshi & Manga";
    if (activeType === "manhwa")  return "Koleksi Manhwa";
    if (activeType === "all")     return "Semua Komik";
    return "Jelajahi Doujinshi, Manga & Manhwa";
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 bg-neutral-950">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-8 text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent flex items-center justify-start gap-3 tracking-tight">
            <Book size={32} className="text-blue-500" /> Doujin Desu
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg leading-relaxed">
            {getSubtitle()}
          </p>
        </header>

        {/* ── Search + Type tabs row ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Text Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul manga..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 self-start">
            {[
              { label: "🔥 Trending", value: "" },
              { label: "Semua",       value: "all" },
              { label: "Manga",       value: "doujin" },
              { label: "Manhwa",      value: "manhwa" },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setActiveType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  activeType === t.value ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tag / Genre section ───────────────────────────────────────── */}
        <div className="mb-8 p-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter Tag</span>
              {activeGenre && (
                <span className="text-xs text-indigo-300 bg-indigo-600/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  Aktif: {ALL_TAGS.find(t => t.value === activeGenre)?.label || activeGenre}
                </span>
              )}
            </div>
            {(activeGenre || activeType || searchQuery) && (
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={12} /> Reset semua
              </button>
            )}
          </div>

          {/* Tag search input */}
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input
              ref={tagInputRef}
              type="text"
              placeholder="Ketik untuk cari tag... (contoh: gyaru, nun, milf)"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            {tagSearch && (
              <button onClick={() => setTagSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                    isActive ? TAG_COLORS_ACTIVE[tag.color] : TAG_COLORS[tag.color]
                  }`}
                >
                  {tag.label}
                </button>
              );
            }) : (
              <p className="text-gray-600 text-xs italic">Tag tidak ditemukan untuk "{tagSearch}"</p>
            )}
          </div>

          {/* Show more / less */}
          {!tagSearch && ALL_TAGS.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllTags(s => !s)}
              className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
            >
              {showAllTags
                ? <><ChevronUp size={12} /> Tampilkan Lebih Sedikit</>
                : <><ChevronDown size={12} /> Tampilkan Semua ({ALL_TAGS.length}) Tag</>
              }
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="my-10 p-6 bg-red-950/40 border border-red-500/30 rounded-2xl flex flex-col justify-center items-center text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-red-400 mb-2">Cloudflare Terdeteksi</h3>
            <p className="text-gray-300 max-w-md">{error}</p>
            <button
              onClick={() => fetchData(page)}
              className="mt-6 px-6 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid Content */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="bg-white/5 aspect-[2/3] rounded-xl w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
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
                  className="group flex flex-col gap-2"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-neutral-900 border border-white/5 group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                    <img
                      src={item.cover_url}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                      <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-wider text-blue-300 border border-white/10">
                        {item.type}
                      </span>
                      {item.latest_chapter && (
                        <span className="text-[10px] font-medium text-gray-300 bg-black/60 px-1.5 py-0.5 rounded">
                          {item.latest_chapter}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="mt-12 flex justify-center items-center gap-4 border-t border-white/10 pt-8">
                <button
                  onClick={() => {
                    setPage(p => Math.max(1, p - 1));
                    fetchData(Math.max(1, page - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={page === 1}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-white/5 border border-white/10 hover:bg-white/10"
                >
                  Prev
                </button>
                <span className="text-gray-400 font-mono">Page {page}</span>
                <button
                  onClick={() => {
                    setPage(p => p + 1);
                    fetchData(page + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all bg-white/5 border border-white/10 hover:bg-white/10 hover:text-blue-400"
                >
                  Next
                </button>
              </div>
            )}
            
            {data.length === 0 && (
              <div className="py-20 text-center text-gray-500">
                Tidak ada komik ditemukan.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
