import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDoujinList } from "../services/doujinService";
import { Book, Search, Filter, AlertTriangle } from "lucide-react";
import SearchBar from "../components/SearchBar";
import GlassCard from "../components/GlassCard";

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy",
  "Harem", "Romance", "School", "Slice of Life", "Isekai", "NTR",
  "Milf", "Incest", "Anal", "Ahegao", "Tentacles", "Yuri"
];

export default function DoujinPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const [activeType, setActiveType] = useState(""); // "" = all, "manga", "manhwa"
  const [activeGenre, setActiveGenre] = useState("");
  const [showGenres, setShowGenres] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = React.useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      // API call to backend
      const results = await getDoujinList(pageNum, activeType, activeGenre, debouncedQuery);
      setData(results || []);
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

  const handleClearFilter = () => {
    setActiveType("");
    setActiveGenre("");
    setSearchQuery("");
  };

  const getSubtitle = () => {
    if (debouncedQuery) return `Pencarian: "${debouncedQuery}"`;
    if (activeGenre) return `Genre: ${activeGenre}`;
    if (activeType === "doujin") return "Koleksi Doujinshi & Manga";
    if (activeType === "manhwa") return "Koleksi Manhwa";
    if (activeType === "all") return "Semua Komik";
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

        {/* Search Bar */}
        <div className="mb-6 max-w-md">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
            <button
              onClick={() => setActiveType("")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeType === "" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setActiveType("all")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeType === "all" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveType("doujin")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeType === "doujin" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Manga
            </button>
            <button
              onClick={() => setActiveType("manhwa")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeType === "manhwa" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
            >
              Manhwa
            </button>
          </div>

          <button
            onClick={() => setShowGenres(!showGenres)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeGenre || showGenres
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            <Filter size={16} />
            {activeGenre || "Genres"}
          </button>
          
          {(activeType || activeGenre) && (
            <button
              onClick={handleClearFilter}
              className="px-3 py-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Genres Dropdown */}
        {showGenres && (
          <div className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-fade-in shadow-xl">
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setActiveGenre(g.toLowerCase());
                    setShowGenres(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                    activeGenre === g.toLowerCase()
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                      : "bg-neutral-800 border-white/10 text-gray-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

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
