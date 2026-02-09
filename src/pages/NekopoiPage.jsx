import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getNekopoiLatest } from "../services/nekopoiService";
import { Menu, Cat, Play } from "lucide-react";

export default function NekopoiPage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = async (pageNum, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const results = await getNekopoiLatest(pageNum);
      const newHits = Array.isArray(results) ? results : [];

      if (isLoadMore) {
        setData((prev) => {
          const existingSlugs = new Set(prev.map((p) => p.slug));
          const uniqueNew = newHits.filter((h) => !existingSlugs.has(h.slug));
          return [...prev, ...uniqueNew];
        });
      } else {
        setData(newHits);
      }
    } catch (error) {
      console.error("Failed to load Nekopoi data", error);
    } finally {
      if (isLoadMore) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, []);

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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent flex items-center justify-center md:justify-start gap-2">
            <Cat size={32} className="text-yellow-500" /> Nekopoi Gallery
          </h1>
          <p className="text-gray-400 mt-1">Latest Hentai Releases</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {data.map((item) => (
              <Link
                key={item.slug}
                to={`/nekopoi/${item.slug}`}
                className="group relative bg-white/5 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-yellow-500/30 hover:shadow-xl hover:shadow-yellow-500/10"
              >
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img
                    src={
                      item.thumbnail ||
                      "https://via.placeholder.com/300x400?text=No+Image"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-yellow-500/90 p-3 rounded-full backdrop-blur-sm shadow-lg shadow-yellow-500/20">
                      <Play className="fill-white text-white" size={24} />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-sm md:text-base line-clamp-2 group-hover:text-yellow-400 transition-colors">
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
              className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-full font-medium transition-all disabled:opacity-50 border border-white/10 hover:border-yellow-500/30 text-yellow-500/80 hover:text-yellow-400"
            >
              {loadingMore ? "Loading..." : "Load More Hentai"}
            </button>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="text-center py-20 text-gray-500">No posts found.</div>
        )}
      </div>
    </div>
  );
}
