import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHimeTrending, getHimeSearch } from "../services/hanimeService";
import { Menu, Tag } from "lucide-react";
import SearchBar from "../components/SearchBar";
import GlassCard from "../components/GlassCard";

const POPULAR_TAGS = [
  "Uncensored", "Creampie", "MILF", "Schoolgirl", "Maid", "Incest",
  "Anal", "Big Tits", "Cosplay", "Threesome", "Ahegao", "NTR",
  "Tentacles", "Lesbian", "Blowjob", "Masturbation", "Amateur", "Mature"
];

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

  const fetchData = React.useCallback(
    async (pageNum, isLoadMore = false) => {
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
    },
    [debouncedQuery],
  );

  // Initial fetch / Search change
  useEffect(() => {
    setPage(1);
    fetchData(1, false);
  }, [debouncedQuery, fetchData]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, true);
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 bg-neutral-950/50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-stretch md:items-end gap-4 md:gap-6 border-b border-white/10 pb-6 text-left">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600">
                PornavHD Discovery
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg">
              {debouncedQuery
                ? `Search results for "${debouncedQuery}"`
                : "Explore trending videos and collections."}
            </p>
          </div>

          <div className="w-full md:w-auto">
            <div className="w-full md:w-80">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          </div>
        </header>

        {/* Popular Tags Menu */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1 mr-1.5">
              <Tag size={13} className="text-pink-500" /> Tags:
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (searchQuery.toLowerCase() === tag.toLowerCase()) {
                    setSearchQuery("");
                    setPage(1);
                  } else {
                    setSearchQuery(tag);
                    setPage(1);
                  }
                }}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide transition-all duration-200 flex items-center gap-1 border ${
                  searchQuery.toLowerCase() === tag.toLowerCase()
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white border-transparent shadow-lg shadow-pink-500/20 scale-105"
                    : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="bg-white/5 aspect-[2/3] rounded-xl w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {data.map((item, idx) => (
                <GlassCard
                  key={`${item.slug}-${idx}`}
                  to={`/hanime/${item.slug}`}
                  title={item.name}
                  thumb={item.cover_url}
                  category={
                    item.views
                      ? `${item.views.toLocaleString()} Views`
                      : "Video"
                  }
                  fallbackIcon={Menu}
                />
              ))}
            </div>

            {data.length > 0 && (
              <div className="mt-20 text-center pb-20">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold transition-all disabled:opacity-50 text-white min-w-[200px] overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-pink-300 transition-colors">
                    {loadingMore ? "Loading..." : "Load More"}
                  </span>
                  <div className="absolute inset-0 bg-pink-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            )}

            {data.length === 0 && !loading && (
              <div className="my-12 p-8 max-w-xl mx-auto text-center bg-neutral-900/80 border border-fuchsia-500/30 rounded-3xl backdrop-blur-xl shadow-2xl shadow-fuchsia-950/30 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-3xl">
                  🛡️
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Galeri PornavHD Dilindungi Cloudflare
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Situs sumber (<strong className="text-fuchsia-300">pornavhd.com</strong>) saat ini mengaktifkan proteksi Cloudflare Turnstile Anti-Bot atau pembatasan IP server, sehingga daftar video tidak dapat ditarik secara otomatis.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full justify-center">
                  <Link
                    to="/hanimetv"
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl shadow-lg shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
                  >
                    <span>🎬 Buka Server Tanpa Blokir (Jav.Guru)</span>
                  </Link>
                  <a
                    href="https://pornavhd.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-xl text-gray-300 hover:text-white font-medium flex items-center justify-center transition-colors"
                  >
                    👉 Buka Web Asli (PornavHD)
                  </a>
                </div>
                <button
                  onClick={() => fetchData(1, false)}
                  className="text-xs text-gray-400 hover:text-fuchsia-400 underline mt-2"
                >
                  🔄 Coba Muat Ulang Galeri
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
