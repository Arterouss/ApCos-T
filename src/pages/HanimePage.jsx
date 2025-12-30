import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHimeTrending, getHimeSearch } from "../services/hanimeService";
import { Menu } from "lucide-react";
import SearchBar from "../components/SearchBar";

export default function HanimePage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (debouncedQuery) {
          const results = await getHimeSearch(debouncedQuery);
          setData(results);
        } else {
          const trending = await getHimeTrending();
          setData(trending);
        }
      } catch (error) {
        console.error("Failed to load hnime data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [debouncedQuery]);

  return (
    <div className="min-h-screen bg-black text-white pb-20 pt-20 px-4 md:px-8">
      <button
        onClick={onOpenSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            HAnime Discovery
          </h1>
          <p className="text-gray-400 mt-1">
            {debouncedQuery
              ? `Results for "${debouncedQuery}"`
              : "Trending Hentai Videos"}
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
                to={`/hanime/${item.slug}`}
                key={item.slug}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3">
                  <img
                    src={item.cover_url}
                    alt={item.name}
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
            {data.length === 0 && !loading && (
              <div className="col-span-full text-center text-gray-500 py-20">
                No videos found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
