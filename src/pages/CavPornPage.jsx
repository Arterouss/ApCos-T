import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCavPornLatest,
  getCavPornSearch,
  getCavPornCategories,
  getCavPornTags,
  getCavPornCategoryVideos,
} from "../services/cavpornService";
import { Menu, Play, Clock, ThumbsUp, Tag, Grid, Filter, ChevronLeft, ChevronRight, X, Flame } from "lucide-react";
import SearchBar from "../components/SearchBar";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";
import { filterBlockedItems, filterBlockedTags } from "../utils/contentFilter";

export default function CavPornPage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = usePersistentState("cavporn_page", 1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);

  useScrollRestoration("cavporn");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load categories and tags on mount
  useEffect(() => {
    const loadMeta = async () => {
      const [cats, tgs] = await Promise.all([
        getCavPornCategories(),
        getCavPornTags(),
      ]);
      setCategories(filterBlockedTags(Array.isArray(cats) ? cats : []));
      setTags(filterBlockedTags(Array.isArray(tgs) ? tgs : []));
    };
    loadMeta();
  }, []);

  // Fetch data on page/search/category change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let results;
        if (debouncedQuery) {
          results = await getCavPornSearch(debouncedQuery, page);
        } else if (activeCategory) {
          results = await getCavPornCategoryVideos(activeCategory.hash, page);
        } else {
          results = await getCavPornLatest(page);
        }
        setData(filterBlockedItems(Array.isArray(results) ? results : []));
      } catch (error) {
        console.error("Failed to load CavPorn data", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, debouncedQuery, activeCategory]);

  const handleCategoryClick = (cat) => {
    setSearchQuery("");
    setPage(1);
    setActiveCategory(cat);
    setShowCategories(false);
  };

  const handleClearFilter = () => {
    setActiveCategory(null);
    setSearchQuery("");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const getSubtitle = () => {
    if (debouncedQuery) return `Hasil pencarian untuk "${debouncedQuery}"`;
    if (activeCategory) return `Kategori: ${activeCategory.name}`;
    return "Video Terbaru Kualitas HD";
  };

  const maxVisiblePages = 5;
  const renderPagination = () => {
    const pages = [];
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    if (data.length > 0) {
      endPage = Math.max(endPage, page + 2);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-10 px-4 sm:px-6 md:px-8 relative overflow-hidden bg-[#07070b]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/[0.05] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/[0.04] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: 'rgba(0, 229, 255, 0.1)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            >
              <Flame size={12} className="animate-pulse" />
              <span>CavPorn HD Streaming</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500">
                CavPorn
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              {getSubtitle()}
            </p>
          </div>

          <div className="w-full md:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari video atau model..."
            />
          </div>
        </div>

        {/* ── Filter Controls ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
          <button
            onClick={() => {
              setShowCategories(!showCategories);
              setShowTags(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer"
            style={{
              background: showCategories || activeCategory
                ? 'linear-gradient(135deg, #00e5ff, #0070f3)'
                : 'rgba(255, 255, 255, 0.04)',
              color: showCategories || activeCategory ? '#000' : '#e5e7eb',
              border: showCategories || activeCategory
                ? '1px solid rgba(0, 229, 255, 0.8)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: showCategories || activeCategory ? '0 0 15px rgba(0, 229, 255, 0.3)' : 'none',
            }}
          >
            <Filter size={15} />
            <span>{activeCategory ? activeCategory.name : "Kategori"}</span>
          </button>

          <button
            onClick={() => {
              setShowTags(!showTags);
              setShowCategories(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer"
            style={{
              background: showTags
                ? 'linear-gradient(135deg, #00e5ff, #0070f3)'
                : 'rgba(255, 255, 255, 0.04)',
              color: showTags ? '#000' : '#e5e7eb',
              border: showTags
                ? '1px solid rgba(0, 229, 255, 0.8)'
                : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: showTags ? '0 0 15px rgba(0, 229, 255, 0.3)' : 'none',
            }}
          >
            <Tag size={15} />
            <span>Tags</span>
          </button>

          {activeCategory && (
            <button
              onClick={handleClearFilter}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neon-cyan bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <span>Hapus Filter</span>
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Categories Drawer ──────────────────────────────────────── */}
        {showCategories && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-5 rounded-2xl"
            style={{
              background: 'rgba(14, 16, 26, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
              Pilih Kategori:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id || cat.hash}
                  onClick={() => handleCategoryClick(cat)}
                  className="p-2.5 rounded-xl text-left transition-all cursor-pointer"
                  style={{
                    background: activeCategory?.hash === cat.hash
                      ? 'linear-gradient(135deg, #00e5ff, #0070f3)'
                      : 'rgba(255, 255, 255, 0.03)',
                    color: activeCategory?.hash === cat.hash ? '#000' : '#d1d5db',
                    border: activeCategory?.hash === cat.hash
                      ? '1px solid rgba(0, 229, 255, 0.8)'
                      : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="text-xs font-bold line-clamp-1">{cat.name}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Tags Drawer ────────────────────────────────────────────── */}
        {showTags && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-5 rounded-2xl"
            style={{
              background: 'rgba(14, 16, 26, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3">
              Tag Populer:
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.hash}
                  onClick={() => {
                    setSearchQuery(tag.name);
                    setShowTags(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Video Grid / Loading Skeletons ─────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-2.5 overflow-hidden flex flex-col gap-3"
                style={{
                  background: 'rgba(14, 16, 26, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div className="aspect-video rounded-xl bg-white/[0.04] relative overflow-hidden animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
                </div>
                <div className="h-4 bg-white/[0.05] rounded-md w-4/5 animate-pulse" />
                <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {data.map((item) => (
              <Link
                key={item.id}
                to={`/cavporn/${item.id}/${item.slug}`}
                className="group flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'rgba(14, 16, 26, 0.6)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.35)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 229, 255, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="aspect-video overflow-hidden relative bg-neutral-900">
                  <img
                    src={
                      item.thumbnail ||
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'%3E%3Crect fill='%23111827' width='320' height='180'/%3E%3C/svg%3E"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        background: '#00e5ff',
                        boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)',
                      }}
                    >
                      <Play size={18} className="fill-black text-black ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {item.duration && (
                    <div
                      className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center gap-1 text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <Clock size={10} />
                      <span>{item.duration}</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 group-hover:text-neon-cyan transition-colors leading-snug text-gray-200">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-mono">
                    {item.views && <span>{item.views}</span>}
                    {item.rating && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <ThumbsUp size={10} /> {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── Numbered Pagination ────────────────────────────────────── */}
        {!loading && data.length > 0 && (
          <div className="mt-14 flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-gray-300 hover:text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {renderPagination().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                  p === page ? "text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
                style={{
                  background: p === page
                    ? 'linear-gradient(135deg, #00e5ff, #0070f3)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: p === page
                    ? '1px solid rgba(0, 229, 255, 0.8)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: p === page ? '0 0 15px rgba(0, 229, 255, 0.4)' : 'none',
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-gray-300 hover:text-white"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Empty State ────────────────────────────────────────────── */}
        {!loading && data.length === 0 && (
          <div
            className="text-center py-24 rounded-3xl p-8 max-w-md mx-auto"
            style={{
              background: 'rgba(14, 16, 26, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <p className="text-gray-400 text-sm">Tidak ada video yang ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
