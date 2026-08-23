import React, { useEffect, useState, useRef } from "react";
import { Search, Book, Flame, X, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { useNhentai } from "../hooks/useNhentai";
import NhentaiCard from "../components/Nhentai/NhentaiCard";
import NhentaiViewer from "../components/Nhentai/NhentaiViewer";

// ── Tag chips ─────────────────────────────────────────────────────────────
const ALL_TAGS = [
  { label: "🔥 Netorare",       value: "netorare",           color: "red"    },
  { label: "💕 Gyaru",          value: "gyaru",               color: "pink"   },
  { label: "👙 Milf",           value: "milf",                color: "orange" },
  { label: "🏫 School Uniform", value: "schoolgirl uniform",  color: "blue"   },
  { label: "😏 Ahegao",         value: "ahegao",              color: "pink"   },
  { label: "🧝 Elf",            value: "elf",                 color: "green"  },
  { label: "🌸 Harem",          value: "harem",               color: "rose"   },
  { label: "👨‍👩‍👧 Incest",       value: "incest",              color: "purple" },
  { label: "🐙 Tentacles",      value: "tentacles",           color: "green"  },
  { label: "👩‍❤️‍👩 Yuri",        value: "yuri",               color: "rose"   },
  { label: "🩺 Nurse",          value: "nurse",               color: "blue"   },
  { label: "👩‍🏫 Teacher",       value: "teacher",            color: "indigo" },
  { label: "🧙 Mind Control",   value: "mind control",        color: "purple" },
  { label: "💀 Mind Break",     value: "mind break",          color: "red"    },
  { label: "🔞 Rape",           value: "rape",                color: "red"    },
  { label: "🤰 Pregnant",       value: "pregnant",            color: "teal"   },
  { label: "🌱 Impregnation",   value: "impregnation",        color: "teal"   },
  { label: "🔗 Bondage",        value: "bondage",             color: "amber"  },
  { label: "🤖 X-Ray",          value: "x-ray",               color: "gray"   },
  { label: "😈 Cheating",       value: "cheating",            color: "orange" },
  { label: "💋 Blowjob",        value: "blowjob",             color: "pink"   },
  { label: "🍑 Paizuri",        value: "paizuri",             color: "pink"   },
  { label: "🔠 Anal",           value: "anal",                color: "orange" },
  { label: "👓 Glasses",        value: "glasses",             color: "blue"   },
  { label: "👗 Maid",           value: "maid",                color: "indigo" },
  { label: "🦄 Monster Girl",   value: "monster girl",        color: "green"  },
  { label: "🌐 Futanari",       value: "futanari",            color: "purple" },
  { label: "🎨 Full Color",     value: "color",               color: "yellow" },
  { label: "🔓 Uncensored",     value: "uncensored",          color: "amber"  },
  { label: "🇬🇧 English",       value: "english",             color: "blue"   },
  { label: "🇯🇵 Japanese",      value: "japanese",            color: "red"    },
];

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

const SORT_OPTIONS = [
  { value: "",               label: "🆕 Terbaru"       },
  { value: "popular-today",  label: "🔥 Popular Hari Ini" },
  { value: "popular-week",   label: "📅 Popular Minggu Ini" },
  { value: "popular",        label: "⭐ Popular Sepanjang Waktu" },
];

const INITIAL_SHOW = 14;

export default function NhentaiPage() {
  const { galleries, loading, error, hasMore, searchGalleries, goToPage, currentSearch, currentSort, page } = useNhentai();
  const [selectedGallery, setSelectedGallery] = useState(null);

  // Search & tag state
  const [searchInput, setSearchInput]   = useState("");
  const [tagSearch,   setTagSearch]     = useState("");
  const [activeTag,   setActiveTag]     = useState("");
  const [showAllTags, setShowAllTags]   = useState(false);

  // On mount load default
  useEffect(() => {
    searchGalleries("", "");
  }, [searchGalleries]);

  // Debounce text search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput.trim()) {
        setActiveTag("");
        searchGalleries(searchInput.trim(), currentSort);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleTagClick = (tagValue) => {
    const next = activeTag === tagValue ? "" : tagValue;
    setActiveTag(next);
    setTagSearch("");
    setSearchInput("");
    searchGalleries(next, currentSort);
  };

  const handleSortChange = (e) => {
    searchGalleries(activeTag || searchInput || currentSearch, e.target.value);
  };

  const handleClearAll = () => {
    setActiveTag("");
    setSearchInput("");
    setTagSearch("");
    searchGalleries("", currentSort);
  };

  const filteredTags = tagSearch.trim()
    ? ALL_TAGS.filter(t =>
        t.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
        t.value.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : showAllTags ? ALL_TAGS : ALL_TAGS.slice(0, INITIAL_SHOW);

  const activeTagObj = ALL_TAGS.find(t => t.value === activeTag);

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
      {/* Viewer Modal */}
      {selectedGallery && (
        <NhentaiViewer
          gallery={selectedGallery}
          onClose={() => setSelectedGallery(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-400 to-white mb-2 flex items-center gap-3">
            <Book className="text-pink-500" size={36} /> Nhentai
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            {activeTag
              ? `Tag: ${activeTagObj?.label || activeTag}`
              : currentSearch
              ? `Pencarian: "${currentSearch}"`
              : "Jelajahi koleksi doujinshi & manga"}
          </p>
        </div>

        {/* ── Search + Sort row ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari judul, tag, atau kode (contoh: 177013)..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/60 focus:ring-1 focus:ring-pink-500/30 transition-all"
            />
            {searchInput && (
              <button onClick={() => setSearchInput("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 self-start">
            <Flame size={16} className="text-rose-400 shrink-0" />
            <select
              value={currentSort || ""}
              onChange={handleSortChange}
              className="bg-black/40 border border-white/10 rounded-xl text-sm text-white px-3 py-2.5 focus:outline-none focus:border-pink-500 transition-all"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Tag chip section ──────────────────────────────────────── */}
        <div className="mb-8 p-4 rounded-2xl bg-white/3 border border-white/8 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-pink-400" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter Tag</span>
              {activeTag && (
                <span className="text-xs text-pink-300 bg-pink-600/20 border border-pink-500/30 px-2 py-0.5 rounded-full">
                  Aktif: {activeTagObj?.label || activeTag}
                </span>
              )}
            </div>
            {(activeTag || searchInput) && (
              <button
                onClick={handleClearAll}
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
              type="text"
              placeholder="Ketik untuk cari tag... (contoh: netorare, gyaru, milf)"
              value={tagSearch}
              onChange={e => setTagSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all"
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
              const isActive = activeTag === tag.value;
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

          {/* Show more/less */}
          {!tagSearch && ALL_TAGS.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllTags(s => !s)}
              className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-pink-400 transition-colors"
            >
              {showAllTags
                ? <><ChevronUp size={12} /> Tampilkan Lebih Sedikit</>
                : <><ChevronDown size={12} /> Tampilkan Semua ({ALL_TAGS.length}) Tag</>
              }
            </button>
          )}
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {galleries.map((gallery) => (
            <NhentaiCard key={gallery.id} gallery={gallery} onClick={setSelectedGallery} />
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-pink-500 animate-ping" />
              </div>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && galleries.length === 0 && !error && (
          <div className="text-center py-32 text-gray-500 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm mx-auto max-w-2xl">
            <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tidak ada hasil</h3>
            <p>Coba ubah kata kunci atau tag pencarian.</p>
          </div>
        )}

        {/* Pagination */}
        {!loading && galleries.length > 0 && (
          <div className="flex justify-center items-center gap-2 py-12">
            <button
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Prev
            </button>

            <div className="flex gap-1">
              {page > 2 && (
                <button onClick={() => goToPage(1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-pink-600/30 transition-colors">1</button>
              )}
              {page > 3 && <span className="w-10 h-10 flex items-center justify-center text-white/50">...</span>}
              {page > 1 && (
                <button onClick={() => goToPage(page - 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-pink-600/30 transition-colors">{page - 1}</button>
              )}
              <button className="w-10 h-10 rounded-lg bg-pink-600 border border-pink-500 text-white font-bold">{page}</button>
              {hasMore && (
                <button onClick={() => goToPage(page + 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-pink-600/30 transition-colors">{page + 1}</button>
              )}
              {hasMore && <span className="w-10 h-10 flex items-center justify-center text-white/50">...</span>}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
