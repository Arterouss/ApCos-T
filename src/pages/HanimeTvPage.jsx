import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getHanimeTrending, getHanimeSearch } from "../services/hanimeTvService";
import { Flame, Play, Tag, Sparkles, ChevronLeft, ChevronRight, Film } from "lucide-react";
import SearchBar from "../components/SearchBar";
import GlassCard from "../components/GlassCard";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

const POPULAR_TAGS = filterBlockedTags([
  "Uncensored", "Creampie", "MILF", "Schoolgirl", "Maid", "Incest",
  "Anal", "Big Tits", "Cosplay", "Threesome", "Ahegao", "NTR",
  "Tentacles", "Lesbian", "Blowjob", "Masturbation", "Amateur", "Mature"
]);

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

  const fetchData = useCallback(
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

        setData(filterBlockedItems(newHits));
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
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-10 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(255, 45, 85, 0.1)',
                color: '#ff2d55',
                border: '1px solid rgba(255, 45, 85, 0.25)',
              }}
            >
              <Flame size={12} className="animate-pulse" />
              <span>Jav.Guru Exclusive Stream</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500">
                Jav.Guru
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              {debouncedQuery
                ? `Hasil pencarian untuk "${debouncedQuery}"`
                : "Katalog video pilihan kualitas HD dengan streaming cepat dan cover jernih."}
            </p>
          </div>

          <div className="w-full md:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari aktris, kode, atau tag..."
            />
          </div>
        </motion.div>

        {/* ── Popular Tags Pills ───────────────────────────────────────── */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mr-2">
              <Tag size={13} className="text-orange-400" /> Tags:
            </span>
            {POPULAR_TAGS.map((tag) => {
              const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (isSelected) {
                      setSearchQuery("");
                      setPage(0);
                    } else {
                      setSearchQuery(tag);
                      setPage(0);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #ff6b35, #ff2d55)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '1px solid rgba(255, 45, 85, 0.6)'
                      : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isSelected ? '0 4px 20px rgba(255, 45, 85, 0.35)' : 'none',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content Grid / Skeletons ─────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden p-2 flex flex-col gap-3"
                style={{
                  background: 'rgba(18, 18, 28, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div className="aspect-[2/3] rounded-xl bg-white/[0.04] relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
                </div>
                <div className="h-4 bg-white/[0.05] rounded-md w-3/4 animate-pulse" />
                <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5"
            >
              {data.map((item, idx) => (
                <GlassCard
                  key={`${item?.id || idx}-${idx}`}
                  to={`/hanimetv/${item?.slug || item?.id || ''}`}
                  title={item?.name || 'Unknown Title'}
                  thumb={item?.poster_url || item?.cover_url || ''}
                  category={
                    item?.views
                      ? `${Number(item.views) ? Number(item.views).toLocaleString() : item.views} Views`
                      : "Jav.Guru"
                  }
                  fallbackIcon={Play}
                />
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {data.length > 0 && (
              <div className="mt-16 flex justify-center items-center gap-2 pb-12 flex-wrap">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0 || loading}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-gray-300 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                {getPageNumbers().map((pNum) => (
                  <button
                    key={pNum}
                    onClick={() => handlePageChange(pNum)}
                    disabled={loading}
                    className={`w-10 h-10 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center cursor-pointer ${
                      page === pNum
                        ? "text-white shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      background: page === pNum
                        ? 'linear-gradient(135deg, #ff6b35, #ff2d55)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: page === pNum
                        ? '1px solid rgba(255, 45, 85, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: page === pNum ? '0 0 20px rgba(255, 45, 85, 0.4)' : 'none',
                    }}
                  >
                    {pNum + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={loading || data.length < 12}
                  className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-gray-300 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Empty State */}
            {data.length === 0 && !loading && (
              <div
                className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
                style={{
                  background: 'rgba(18, 18, 28, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
                  <Film size={28} />
                </div>
                <h3 className="text-lg font-bold text-white">Tidak Ada Video</h3>
                <p className="text-gray-400 text-xs">
                  Tidak ditemukan video yang sesuai dengan kata kunci atau filter saat ini.
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neon-red bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
