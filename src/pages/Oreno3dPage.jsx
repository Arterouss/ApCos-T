import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getOreno3dLatest, getOreno3dSearch } from "../services/oreno3dService";
import {
  Menu,
  Play,
  Box,
  ChevronLeft,
  ChevronRight,
  Flame,
  Star,
  TrendingUp,
  Clock,
  Sparkles,
  Eye,
} from "lucide-react";

import SearchBar from "../components/SearchBar";

const SORT_TABS = [
  { key: "latest", label: "New Arrivals", icon: Sparkles },
  { key: "new",    label: "All Movies",   icon: Clock },
  { key: "popular",label: "Most Viewed",  icon: TrendingUp },
  { key: "rated",  label: "Highly Rated", icon: Star },
];

// ── Pagination numbers ──────────────────────────────────────────────
function PaginationBar({ page, setPage, hasNext, topRef }) {
  const goTo = (p) => {
    setPage(p);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Build visible page numbers: always show ±2 around current
  const pages = [];
  const start = Math.max(1, page - 2);
  const end   = page + 2;
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (!hasNext && page < end) {/* trim trailing beyond last */}

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {/* Prev */}
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40
          disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} /> Prev
      </button>

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-500 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p)}
            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all border
              ${p === page
                ? "bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/30"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-cyan-500/20 hover:border-cyan-500/40"
              }`}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => goTo(page + 1)}
        disabled={!hasNext}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/40
          disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────
export default function Oreno3dPage({ onOpenSidebar }) {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasNext, setHasNext]         = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeSort, setActiveSort]   = useState("latest");

  const topRef = useRef(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page on filter / search change
  useEffect(() => {
    setPage(1);
    setHasNext(true);
  }, [debouncedQuery, activeSort]);

  // Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let results;
        if (debouncedQuery) {
          results = await getOreno3dSearch(debouncedQuery, page);
        } else {
          results = await getOreno3dLatest(page, activeSort);
        }
        const arr = Array.isArray(results) ? results : [];
        setData(arr);
        setHasNext(arr.length >= 20); // assume 20/page; no next if fewer
      } catch (err) {
        console.error("Failed to load Oreno3D data", err);
        setData([]);
        setHasNext(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedQuery, activeSort]);

  const handleSortChange = (key) => {
    setActiveSort(key);
    setSearchQuery("");
  };

  return (
    <div ref={topRef} className="min-h-screen text-white pb-20 pt-20 px-4 md:px-8 bg-neutral-950">
      {/* Mobile menu button */}
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6 text-center md:text-left">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center md:justify-start gap-2">
            <Box size={32} className="text-cyan-500" /> Iwara TV Gallery
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {debouncedQuery
              ? `Search results for "${debouncedQuery}"`
              : SORT_TABS.find((t) => t.key === activeSort)?.label ?? "3D Animations"}
          </p>
        </header>

        {/* Search */}
        <div className="mb-6 max-w-xl">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search Iwara TV..."
          />
        </div>

        {/* Sort / Filter Tabs */}
        {!debouncedQuery && (
          <div className="flex flex-wrap gap-2 mb-8">
            {SORT_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleSortChange(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border
                  ${activeSort === key
                    ? "bg-cyan-500 text-black border-cyan-500 shadow-md shadow-cyan-500/30"
                    : "bg-white/5 border-white/10 text-gray-300 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300"
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No posts found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {data.map((item) => (
              <Link
                key={item.id || item.slug}
                to={`/oreno3d/${item.slug || item.id}`}
                state={{ videoData: item }}
                className="group relative bg-white/5 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                {/* Thumbnail */}
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img
                    src={item.thumbnail || "https://placehold.co/300x400/111827/6b7280?text=No+Image"}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => { e.target.src = "https://placehold.co/300x400/111827/6b7280?text=No+Image"; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                  {/* Views/likes overlay */}
                  {(item.views || item.likes) && (
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {item.views != null && (
                        <span className="flex items-center gap-0.5 bg-black/60 text-gray-300 text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                          <Eye size={9} /> {Number(item.views).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Play overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-cyan-500/90 p-3 rounded-full backdrop-blur-sm shadow-lg shadow-cyan-500/20">
                      <Play className="fill-white text-white" size={22} />
                    </div>
                  </div>
                </div>

                {/* Title + author */}
                <div className="p-3">
                  <h3 className="font-medium text-xs md:text-sm line-clamp-2 group-hover:text-cyan-400 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{item.author}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <PaginationBar
            page={page}
            setPage={setPage}
            hasNext={hasNext}
            topRef={topRef}
          />
        )}

        {/* Current page info */}
        {!loading && data.length > 0 && (
          <p className="text-center text-gray-600 text-xs mt-3">Page {page}</p>
        )}
      </div>
    </div>
  );
}
