import React, { useEffect, useState } from "react";
import { Search, Book, Flame, Clock, Tag } from "lucide-react";
import { useNhentai } from "../hooks/useNhentai";
import NhentaiCard from "../components/Nhentai/NhentaiCard";
import NhentaiViewer from "../components/Nhentai/NhentaiViewer";
import SearchBar from "../components/Rule34/SearchBar";

const GENRES = [
  "english", "japanese", "chinese", "translated", "milf", "incest", "netorare", 
  "anal", "yuri", "yaoi", "futanari", "big breasts", "sole female", "sole male",
  "schoolgirl uniform", "glasses", "rape", "shotacon", "lolicon", "ahegao",
  "paizuri", "blowjob", "bondage", "cheating", "harem", "maid", "nurse", 
  "teacher", "elf", "monster girl", "tentacles", "mind break", "mind control", 
  "x-ray", "impregnation", "pregnant", "story arc", "color", "uncensored"
];
const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "popular-today", label: "Popular Today" },
  { value: "popular-week", label: "Popular Week" },
  { value: "popular", label: "Popular All-Time" },
];

export default function NhentaiPage({ onOpenSidebar }) {
  const { galleries, loading, error, hasMore, searchGalleries, goToPage, currentSearch, currentSort, page } = useNhentai();
  const [selectedGallery, setSelectedGallery] = useState(null);

  useEffect(() => {
    searchGalleries("", "");
  }, [searchGalleries]);

  const handleGenreClick = (genre) => {
    searchGalleries(genre, currentSort);
  };

  const handleSearch = (query) => {
    searchGalleries(query, currentSort);
  };

  const handleSortChange = (e) => {
    searchGalleries(currentSearch, e.target.value);
  };

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
      {/* Viewer Modal */}
      {selectedGallery && (
        <NhentaiViewer
          gallery={selectedGallery}
          onClose={() => setSelectedGallery(null)}
        />
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-rose-400 to-white mb-2 sm:mb-3 flex items-center gap-3">
          <Book className="text-pink-500" size={36} /> Nhentai
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base font-light mb-6 md:mb-8 max-w-2xl">
          Explore and read an extensive collection of doujinshi and manga. You can search by tags, titles, or 6-digit nuclear codes.
        </p>

        <SearchBar 
          onSearch={handleSearch} 
          initialValue={currentSearch} 
          placeholder="Search tags, title, or nuclear code (e.g. 177013)..."
        />

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex-1 flex overflow-x-auto pb-2 sm:pb-0 gap-2 items-center custom-scrollbar">
            <Tag size={16} className="text-pink-400 mr-1 shrink-0" />
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => handleGenreClick(genre)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors shrink-0 ${currentSearch === genre ? 'bg-pink-500 text-white border-pink-500' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}
              >
                {genre}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Flame size={16} className="text-rose-400" />
            <select
              value={currentSort || ""}
              onChange={handleSortChange}
              className="bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-1.5 focus:outline-none focus:border-pink-500"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {galleries.map((gallery) => (
          <NhentaiCard key={gallery.id} gallery={gallery} onClick={setSelectedGallery} />
        ))}
      </div>

      {/* Loading / Empty States */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-pink-500 animate-ping"></div>
            </div>
          </div>
        </div>
      )}

      {!loading && galleries.length === 0 && !error && (
        <div className="text-center py-32 text-gray-500 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm mx-auto max-w-2xl">
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No results found
          </h3>
          <p>Try adjusting your search terms or filters.</p>
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
            
            {hasMore && (
               <span className="w-10 h-10 flex items-center justify-center text-white/50">...</span>
            )}
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
  );
}
