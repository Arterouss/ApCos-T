import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCosplayLatest,
  getCosplaySearch,
} from "../services/cosplayService";
import { Camera, Sparkles, Loader2, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-14 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="relative mb-8 p-6 sm:p-8 rounded-3xl glass-card overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold tracking-wider uppercase mb-3">
                <Sparkles size={12} className="animate-spin text-pink-400" />
                Telegram Cosplay Vault
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-display">
                Cosplay<span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400">Tele</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-2 max-w-xl">
                {debouncedQuery
                  ? `Hasil pencarian untuk "${debouncedQuery}"`
                  : "Koleksi photo pack & video cosplay premium Telegram kualitas tertinggi."}
              </p>
            </div>

            <div className="w-full md:w-96 flex-shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari model, karakter, atau anime..."
              />
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl overflow-hidden p-2 animate-pulse space-y-3"
              >
                <div className="bg-white/5 aspect-[2/3] rounded-xl" />
                <div className="h-4 bg-white/5 rounded-md w-3/4" />
                <div className="h-3 bg-white/5 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : data.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {data.map((item, index) => (
                <motion.div
                  key={item.slug || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: (index % 12) * 0.03 }}
                >
                  <Link
                    to={`/cosplay/${item.slug}`}
                    className="group relative flex flex-col h-full rounded-2xl glass-card overflow-hidden border border-white/10 hover:border-pink-500/40 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 hover:-translate-y-1.5"
                  >
                    {/* Media Container */}
                    <div className="aspect-[2/3] overflow-hidden relative w-full bg-neutral-900/60">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                      {/* Top Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-pink-300 border border-pink-500/30 flex items-center gap-1.5 shadow-md">
                          <Camera size={11} className="text-pink-400" />
                          Set
                        </span>
                      </div>

                      {/* Hover action pill */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="px-4 py-2 rounded-full bg-pink-500/90 text-white text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg shadow-pink-500/40 scale-90 group-hover:scale-100 transition-all">
                          Lihat Galeri <ArrowRight size={13} />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-200 line-clamp-2 group-hover:text-pink-300 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                        <span className="text-pink-400 font-medium">CosplayTele</span>
                        <span className="text-gray-400 group-hover:text-pink-300 transition-colors">Buka &rarr;</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="glass-card rounded-3xl p-12 text-center max-w-md mx-auto my-12 border border-white/10">
            <Camera size={44} className="mx-auto text-pink-400/50 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Tidak Ditemukan</h3>
            <p className="text-gray-400 text-sm">
              Tidak ada set cosplay yang cocok dengan kata kunci tersebut.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && data.length > 0 && (
          <div className="mt-14 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3.5 rounded-full font-bold text-sm tracking-wide bg-gradient-to-r from-pink-600/30 via-rose-600/30 to-purple-600/30 hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 border border-pink-500/40 hover:border-pink-400 text-white transition-all duration-300 shadow-lg shadow-pink-600/10 hover:shadow-pink-600/30 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin text-pink-300" />
                  Memuat Set Berikutnya...
                </>
              ) : (
                <>
                  Muat Lebih Banyak Cosplay
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
