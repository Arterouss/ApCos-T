import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHimeTrending, getHimeSearch } from "../services/hanimeService";
import { Menu } from "lucide-react";
import SearchBar from "../components/SearchBar";

export default function HanimePage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = async (pageNum, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      let results;
      if (debouncedQuery) {
        results = await getHimeSearch(debouncedQuery, pageNum);
      } else {
        results = await getHimeTrending(pageNum);
      }

      let newHits = [];
      if (results && results.hits) newHits = results.hits;
      else if (Array.isArray(results)) newHits = results;

      if (isLoadMore) {
        setData((prev) => {
          // Avoid duplicates
          const existingIds = new Set(prev.map((p) => p.slug));
          const uniqueNew = newHits.filter((h) => !existingIds.has(h.slug));
          return [...prev, ...uniqueNew];
        });
      } else {
        setData(newHits);
      }
    } catch (error) {
      console.error("Failed to load hnime data", error);
      if (!isLoadMore) setData([]);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  // Initial fetch / Search change
  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, [debouncedQuery]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-20 px-4 md:px-8">
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            NimexH Discovery
          </h1>
          <p className="text-gray-400 mt-1">
            {debouncedQuery
              ? `Results for "${debouncedQuery}"`
              : "NimexH Trending"}
          </p>
        </header>

        <div className="mb-8 max-w-2xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 aspect-[2/3] rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {data.map((item, idx) => (
                <Link
                  to={`/hanime/${item.slug}`}
                  key={`${item.slug}-${idx}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                    <img
                      src={item.cover_url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                      <span className="text-pink-400 text-xs font-bold uppercase tracking-wider">
                        {item.views ? item.views.toLocaleString() : "0"} Views
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-200 group-hover:text-pink-400 transition-colors line-clamp-2">
                    {item.name}
                  </h3>
                </Link>
              ))}
            </div>

            {data.length > 0 && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full font-semibold transition-all disabled:opacity-50 text-white"
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}

            {data.length === 0 && !loading && (
              <div className="col-span-full text-center text-gray-500 py-20">
                No videos found.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
