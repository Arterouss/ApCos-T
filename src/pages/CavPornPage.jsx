import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getCavPornLatest,
  getCavPornSearch,
  getCavPornCategories,
  getCavPornTags,
  getCavPornCategoryVideos,
} from "../services/cavpornService";
import { Menu, Play, Clock, ThumbsUp, Tag, Grid } from "lucide-react";
import SearchBar from "../components/SearchBar";

export default function CavPornPage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategories, setShowCategories] = useState(false);
  const [showTags, setShowTags] = useState(false);

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
      setCategories(Array.isArray(cats) ? cats : []);
      setTags(Array.isArray(tgs) ? tgs : []);
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
        setData(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Failed to load CavPorn data", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, debouncedQuery, activeCategory]);

  // Reset to page 1 on filter change
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

  // When search changes, reset page
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const getSubtitle = () => {
    if (debouncedQuery) return `Results for "${debouncedQuery}"`;
    if (activeCategory) return `Category: ${activeCategory.name}`;
    return "Latest Videos";
  };

  // Pagination: show up to 7 page numbers centered on current page
  const maxVisiblePages = 7;
  const renderPagination = () => {
    const pages = [];
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;

    // Always show at least current page + a few more
    if (data.length > 0) {
      endPage = Math.max(endPage, page + 3);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent flex items-center justify-center md:justify-start gap-2">
            <Play size={32} className="text-red-500" /> CavPorn
          </h1>
          <p className="text-gray-400 mt-1">{getSubtitle()}</p>
        </header>

        {/* Search Bar */}
        <div className="mb-6 max-w-2xl">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => {
              setShowCategories(!showCategories);
              setShowTags(false);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
              showCategories
                ? "bg-red-600 text-white border-red-500"
                : "bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-red-500/30"
            }`}
          >
            <Grid size={16} /> Categories
          </button>
          <button
            onClick={() => {
              setShowTags(!showTags);
              setShowCategories(false);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border flex items-center gap-2 ${
              showTags
                ? "bg-red-600 text-white border-red-500"
                : "bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-red-500/30"
            }`}
          >
            <Tag size={16} /> Tags
          </button>

          {activeCategory && (
            <button
              onClick={handleClearFilter}
              className="px-4 py-2 rounded-full text-sm font-medium bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40 transition-all flex items-center gap-1"
            >
              ✕ {activeCategory.name}
            </button>
          )}
        </div>

        {/* Categories Dropdown */}
        {showCategories && categories.length > 0 && (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.hash}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all border ${
                    activeCategory?.hash === cat.hash
                      ? "bg-red-600 text-white border-red-500"
                      : "bg-white/5 text-gray-300 hover:text-white border-white/5 hover:border-red-500/30 hover:bg-white/10"
                  }`}
                >
                  {cat.name}
                  {cat.count !== "0" && (
                    <span className="ml-1 text-xs opacity-60">
                      ({cat.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags Dropdown */}
        {showTags && tags.length > 0 && (
          <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
              Popular Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.hash}
                  onClick={() => {
                    setSearchQuery(tag.name);
                    setShowTags(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-gray-300 hover:text-white border border-white/5 hover:border-red-500/30 hover:bg-white/10 transition-all"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-800 aspect-video rounded-xl mb-3"></div>
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {data.map((item) => (
              <Link
                key={item.id}
                to={`/cavporn/${item.id}/${item.slug}`}
                className="group relative bg-white/5 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/10"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={
                      item.thumbnail ||
                      "https://via.placeholder.com/320x180?text=No+Thumb"
                    }
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Play Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-600/90 p-3 rounded-full backdrop-blur-sm shadow-lg shadow-red-500/20">
                      <Play className="fill-white text-white" size={24} />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-mono flex items-center gap-1">
                      <Clock size={10} />
                      {item.duration}
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {item.views && <span>{item.views} views</span>}
                    {item.rating && (
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={10} /> {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Numbered Pagination */}
        {!loading && data.length > 0 && (
          <div className="mt-12 flex justify-center items-center gap-2 flex-wrap">
            {/* Previous Button */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-red-500/30"
            >
              ‹ Prev
            </button>

            {/* Page Numbers */}
            {renderPagination().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-all border ${
                  p === page
                    ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20"
                    : "bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-red-500/30 hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}

            {/* Next Button */}
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all border bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-red-500/30"
            >
              Next ›
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && data.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            No videos found.
          </div>
        )}
      </div>
    </div>
  );
}
