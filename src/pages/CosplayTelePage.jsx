import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCosplayLatest,
  getCosplaySearch,
  getCosplayVideos,
} from "../services/cosplayService";
import { Menu, Camera, Video, Download, Play } from "lucide-react";
import SearchBar from "../components/SearchBar";

export default function CosplayTelePage({ onOpenSidebar }) {
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
        results = await getCosplaySearch(debouncedQuery, pageNum);
      } else {
        results = await getCosplayLatest(pageNum);
      }

      const newHits = Array.isArray(results) ? results : [];

      if (isLoadMore) {
        setData((prev) => {
          // Avoid duplicates by slug
          const existingSlugs = new Set(prev.map((p) => p.slug));
          const uniqueNew = newHits.filter((h) => !existingSlugs.has(h.slug));
          return [...prev, ...uniqueNew];
        });
      } else {
        setData(newHits);
      }
    } catch (error) {
      console.error("Failed to load cosplay data", error);
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
    <div className="min-h-screen text-white pb-20 pt-20 px-4 md:px-8 bg-neutral-950">
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">
            CosplayTele Gallery
          </h1>
          <p className="text-gray-400 mt-1">
            {debouncedQuery
              ? `Results for "${debouncedQuery}"`
              : "Latest Cosplay Packs & Sets"}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.map((item) => (
              <Link
                key={item.slug}
                to={`/cosplay/detail/${item.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-gray-900 border border-white/5 hover:border-pink-500/50 transition-all duration-300"
              >
                <div className="aspect-[2/3] overflow-hidden relative">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Hover Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-pink-600/90 p-3 rounded-full backdrop-blur-sm">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 group-hover:text-pink-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && data.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full font-medium transition-all disabled:opacity-50 border border-white/10"
            >
              {loadingMore ? "Loading..." : "Load More Cosplay"}
            </button>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No cosplay sets found.
          </div>
        )}
      </div>
    </div>
  );
}
