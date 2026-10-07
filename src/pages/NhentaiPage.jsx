import React, { useEffect, useState } from "react";
import { Search, Book, Flame, X, ChevronDown, ChevronUp, Tag, Sparkles } from "lucide-react";
import { useNhentai } from "../hooks/useNhentai";
import NhentaiCard from "../components/Nhentai/NhentaiCard";
import NhentaiViewer from "../components/Nhentai/NhentaiViewer";
import { useModalBack } from "../hooks/useModalBack";

// ── Tag chips ─────────────────────────────────────────────────────────────
const ALL_TAGS = [
  { label: "🔥 Netorare", value: "netorare", color: "red" },
  { label: "💕 Gyaru", value: "gyaru", color: "pink" },
  { label: "👙 Milf", value: "milf", color: "orange" },
  { label: "🏫 School Uniform", value: "schoolgirl uniform", color: "blue" },
  { label: "😏 Ahegao", value: "ahegao", color: "pink" },
  { label: "🧝 Elf", value: "elf", color: "green" },
  { label: "🌸 Harem", value: "harem", color: "rose" },
  { label: "👨‍👩‍👧 Incest", value: "incest", color: "purple" },
  { label: "🐙 Tentacles", value: "tentacles", color: "green" },
  { label: "👩‍❤️‍👩 Yuri", value: "yuri", color: "rose" },
  { label: "🩺 Nurse", value: "nurse", color: "blue" },
  { label: "👩‍🏫 Teacher", value: "teacher", color: "indigo" },
  { label: "🧙 Mind Control", value: "mind control", color: "purple" },
  { label: "💀 Mind Break", value: "mind break", color: "red" },
  { label: "🔞 Rape", value: "rape", color: "red" },
  { label: "🤰 Pregnant", value: "pregnant", color: "teal" },
  { label: "🌱 Impregnation", value: "impregnation", color: "teal" },
  { label: "🔗 Bondage", value: "bondage", color: "amber" },
  { label: "🤖 X-Ray", value: "x-ray", color: "gray" },
  { label: "😈 Cheating", value: "cheating", color: "orange" },
  { label: "💋 Blowjob", value: "blowjob", color: "pink" },
  { label: "🍑 Paizuri", value: "paizuri", color: "pink" },
  { label: "🔠 Anal", value: "anal", color: "orange" },
  { label: "👓 Glasses", value: "glasses", color: "blue" },
  { label: "👗 Maid", value: "maid", color: "indigo" },
  { label: "🦄 Monster Girl", value: "monster girl", color: "green" },
  { label: "🌐 Futanari", value: "futanari", color: "purple" },
  { label: "🎨 Full Color", value: "color", color: "yellow" },
  { label: "🔓 Uncensored", value: "uncensored", color: "amber" },
  { label: "🇬🇧 English", value: "english", color: "blue" },
  { label: "🇯🇵 Japanese", value: "japanese", color: "red" },
];

const TAG_COLORS = {
  red: "glass-card border-red-500/30 text-red-300 hover:border-red-500/60",
  pink: "glass-card border-pink-500/30 text-pink-300 hover:border-pink-500/60",
  orange: "glass-card border-orange-500/30 text-orange-300 hover:border-orange-500/60",
  blue: "glass-card border-blue-500/30 text-blue-300 hover:border-blue-500/60",
  purple: "glass-card border-purple-500/30 text-purple-300 hover:border-purple-500/60",
  indigo: "glass-card border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60",
  yellow: "glass-card border-yellow-500/30 text-yellow-300 hover:border-yellow-500/60",
  green: "glass-card border-green-500/30 text-green-300 hover:border-green-500/60",
  teal: "glass-card border-teal-500/30 text-teal-300 hover:border-teal-500/60",
  rose: "glass-card border-rose-500/30 text-rose-300 hover:border-rose-500/60",
  amber: "glass-card border-amber-500/30 text-amber-300 hover:border-amber-500/60",
  gray: "glass-card border-gray-500/30 text-gray-300 hover:border-gray-500/60",
};

const TAG_COLORS_ACTIVE = {
  red: "bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/40",
  pink: "bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-500/40",
  orange: "bg-orange-600 border-orange-500 text-white shadow-lg shadow-orange-500/40",
  blue: "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/40",
  purple: "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/40",
  indigo: "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/40",
  yellow: "bg-yellow-500 border-yellow-400 text-black font-bold shadow-lg shadow-yellow-500/40",
  green: "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/40",
  teal: "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/40",
  rose: "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-500/40",
  amber: "bg-amber-500 border-amber-400 text-black font-bold shadow-lg shadow-amber-500/40",
  gray: "bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/40",
};

const SORT_OPTIONS = [
  { value: "", label: "🆕 Terbaru" },
  { value: "popular-today", label: "🔥 Populer Hari Ini" },
  { value: "popular-week", label: "📅 Populer Minggu Ini" },
  { value: "popular", label: "⭐ Populer Sepanjang Waktu" },
];

const INITIAL_SHOW = 14;

export default function NhentaiPage() {
  const {
    galleries,
    loading,
    error,
    hasMore,
    searchGalleries,
    goToPage,
    currentSearch,
    currentSort,
    page,
  } = useNhentai();
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(-1);

  const openGallery = (gallery, idx) => {
    setSelectedGallery(gallery);
    setSelectedGalleryIdx(idx);
  };

  const closeGallery = () => {
    window.dispatchEvent(new Event("nhentai-read-update"));
    setSelectedGallery(null);
    setSelectedGalleryIdx(-1);
  };

  useModalBack(!!selectedGallery, closeGallery);

  const [searchInput, setSearchInput] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    searchGalleries("", "");
  }, [searchGalleries]);

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
    ? ALL_TAGS.filter(
        (t) =>
          t.label.toLowerCase().includes(tagSearch.toLowerCase()) ||
          t.value.toLowerCase().includes(tagSearch.toLowerCase())
      )
    : showAllTags
    ? ALL_TAGS
    : ALL_TAGS.slice(0, INITIAL_SHOW);

  const activeTagObj = ALL_TAGS.find((t) => t.value === activeTag);

  return (
    <div className="min-h-screen text-white pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8 pb-24">
      {/* Viewer Modal */}
      {selectedGallery && (
        <NhentaiViewer
          gallery={selectedGallery}
          galleries={galleries}
          currentIdx={selectedGalleryIdx}
          onNavigate={(gallery, idx) => openGallery(gallery, idx)}
          onClose={closeGallery}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Hero */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-pink-400" />
                Doujinshi Library
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                NHentai <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300">Catalog</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                {activeTag
                  ? `Menampilkan tag: ${activeTagObj?.label || activeTag}`
                  : currentSearch
                  ? `Hasil pencarian untuk: "${currentSearch}"`
                  : "Jelajahi pustaka doujinshi, komik, dan manga Jepang terlengkap."}
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Cari judul, tag, ID (e.g. 177013)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-black/40 border border-white/10 rounded-full text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/60 transition-all"
                />
                {searchInput && (
                  <button
                    onClick={() => setSearchInput("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <select
                  value={currentSort || ""}
                  onChange={handleSortChange}
                  className="bg-black/40 border border-white/10 rounded-full text-xs sm:text-sm text-white px-4 py-2.5 focus:outline-none focus:border-pink-500 transition-all"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-neutral-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tag Filters Box */}
        <div className="p-5 rounded-3xl glass-card border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-pink-400" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                Filter Tag Populer
              </span>
              {activeTag && (
                <span className="text-xs text-pink-300 bg-pink-600/20 border border-pink-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                  Aktif: {activeTagObj?.label || activeTag}
                </span>
              )}
            </div>

            {(activeTag || searchInput) && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
              >
                <X size={12} /> Reset Semua
              </button>
            )}
          </div>

          {/* Quick Tag Search */}
          <div className="relative mb-3">
            <Search
              size={13}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter tag cepat... (netorare, gyaru, milf)"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-black/30 border border-white/10 rounded-full text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition-all"
            />
            {tagSearch && (
              <button
                onClick={() => setTagSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Tag Chips */}
          <div className="flex flex-wrap gap-2">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag) => {
                const isActive = activeTag === tag.value;
                return (
                  <button
                    key={tag.value}
                    onClick={() => handleTagClick(tag.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                      isActive
                        ? TAG_COLORS_ACTIVE[tag.color]
                        : TAG_COLORS[tag.color]
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })
            ) : (
              <p className="text-gray-500 text-xs italic">
                Tag tidak ditemukan untuk "{tagSearch}"
              </p>
            )}
          </div>

          {!tagSearch && ALL_TAGS.length > INITIAL_SHOW && (
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="mt-3.5 flex items-center gap-1 text-xs text-gray-400 hover:text-pink-300 font-medium transition-colors"
            >
              {showAllTags ? (
                <>
                  <ChevronUp size={13} /> Sembunyikan Sebagian
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Tampilkan Semua ({ALL_TAGS.length}) Tag
                </>
              )}
            </button>
          )}
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="p-4 glass-card border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
            <p>Terjadi kesalahan: {error}</p>
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {galleries.map((gallery, idx) => (
            <NhentaiCard
              key={gallery.id}
              gallery={gallery}
              onClick={(g) => openGallery(g, idx)}
            />
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
            <p className="text-xs text-pink-300 uppercase tracking-widest font-semibold">
              Memuat Katalog Doujin...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && galleries.length === 0 && !error && (
          <div className="text-center py-24 text-gray-500 glass-card rounded-3xl border border-white/10 max-w-md mx-auto">
            <Search className="text-gray-600 mx-auto mb-3" size={36} />
            <h3 className="text-base font-bold text-white mb-1">Tidak Ada Hasil</h3>
            <p className="text-xs text-gray-400">
              Coba gunakan kata kunci atau filter tag yang berbeda.
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && galleries.length > 0 && (
          <div className="flex justify-center items-center gap-2 py-12">
            <button
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-full glass-card border border-white/10 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-pink-500/40 transition-all shadow-md"
            >
              Sebelumnya
            </button>

            <div className="flex gap-1.5">
              {page > 2 && (
                <button
                  onClick={() => goToPage(1)}
                  className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-pink-500/40 transition-colors"
                >
                  1
                </button>
              )}
              {page > 3 && (
                <span className="w-9 h-9 flex items-center justify-center text-white/50 text-xs">
                  ...
                </span>
              )}
              {page > 1 && (
                <button
                  onClick={() => goToPage(page - 1)}
                  className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-pink-500/40 transition-colors"
                >
                  {page - 1}
                </button>
              )}
              <button className="w-9 h-9 rounded-full bg-pink-600 border border-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30">
                {page}
              </button>
              {hasMore && (
                <button
                  onClick={() => goToPage(page + 1)}
                  className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-pink-500/40 transition-colors"
                >
                  {page + 1}
                </button>
              )}
              {hasMore && (
                <span className="w-9 h-9 flex items-center justify-center text-white/50 text-xs">
                  ...
                </span>
              )}
            </div>

            <button
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore}
              className="px-4 py-2 rounded-full glass-card border border-white/10 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-pink-500/40 transition-all shadow-md"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
