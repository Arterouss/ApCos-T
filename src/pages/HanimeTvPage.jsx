import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHanimeTrending, getHanimeSearch } from "../services/hanimeTvService";
import { Menu, Play } from "lucide-react";
import SearchBar from "../components/SearchBar";
import GlassCard from "../components/GlassCard";

export default function HanimeTvPage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = React.useCallback(
    async (pageNum) => {
      setLoading(true);
      try {
        let results;
        if (debouncedQuery) {
          results = await getHanimeSearch(debouncedQuery, pageNum);
        } else {
          results = await getHanimeTrending(pageNum, "month");
        }

        let newHits = [];
        if (results && results.hentai_videos) newHits = results.hentai_videos;
        else if (results && results.videos) newHits = results.videos;
        else if (Array.isArray(results)) newHits = results;

        setData(newHits);
      } catch (error) {
        console.error("Failed to load hanime data", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQuery],
  );

  useEffect(() => {
    setPage(0);
    fetchData(0);
  }, [debouncedQuery, fetchData]);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || newPage === page || loading) return;
    setPage(newPage);
    fetchData(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const totalPagesToShow = 5;
    let start = Math.max(0, page - Math.floor(totalPagesToShow / 2));
    const pages = [];
    for (let i = 0; i < totalPagesToShow; i++) {
      pages.push(start + i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-24 px-4 md:px-8 bg-neutral-950/50">
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-red-500 to-rose-600">
                Jav.Guru
              </span>
            </h1>
            <p className="text-gray-400 text-sm max-w-lg">
              {debouncedQuery
                ? `Search results for "${debouncedQuery}"`
                : "Explore latest Japanese Adult Videos from Jav.Guru."}
            </p>
          </div>

          <div className="w-full md:w-auto">
            <div className="w-full md:w-80">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="bg-white/5 aspect-[16/9] rounded-xl w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {data.map((item, idx) => (
                <GlassCard
                  key={`${item.id}-${idx}`}
                  to={`/hanimetv/${item.slug || item.id}`}
                  title={item.name}
                  thumb={item.poster_url || item.cover_url}
                  category={
                    item.views
                      ? `${item.views.toLocaleString()} Views`
                      : "Anime"
                  }
                  fallbackIcon={Play}
                />
              ))}
            </div>

            {data.length > 0 && (
              <div className="mt-16 flex justify-center items-center gap-2 pb-20 flex-wrap">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0 || loading}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none text-white text-sm shadow-md"
                >
                  Prev
                </button>

                {getPageNumbers().map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-all flex items-center justify-center border ${
                      page === pNum
                        ? "bg-gradient-to-r from-orange-500 to-rose-600 text-white border-transparent shadow-lg shadow-rose-500/30 scale-105"
                        : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {pNum + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || data.length < 12}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition-all disabled:opacity-30 disabled:pointer-events-none text-white text-sm shadow-md"
                >
                  Next
                </button>
              </div>
            )}

            {data.length === 0 && !loading && (
              <div className="py-20 text-center text-gray-500 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                  <Menu size={24} className="opacity-30" />
                </div>
                <p>No videos found.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
