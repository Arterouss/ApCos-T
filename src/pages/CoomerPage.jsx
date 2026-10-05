import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Users, Loader2, ChevronLeft, ChevronRight,
  Heart, Sparkles, Image as ImageIcon, Video, Filter, Grid, Flame
} from "lucide-react";
import { getCoomerCreators, getCoomerPosts } from "../services/coomerService";

const SERVICES = [
  { key: "all", label: "Semua", color: "from-rose-500 to-violet-500" },
  { key: "onlyfans", label: "OnlyFans", color: "from-sky-500 to-blue-600" },
  { key: "fansly", label: "Fansly", color: "from-blue-600 to-indigo-600" },
  { key: "patreon", label: "Patreon", color: "from-orange-500 to-red-500" },
  { key: "candfans", label: "CandFans", color: "from-pink-500 to-rose-500" },
];

export default function CoomerPage({ onOpenSidebar }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("creators"); // "creators" | "posts"
  const [service, setService] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [creatorsData, setCreatorsData] = useState({ creators: [], total: 0, hasMore: false });
  const [postsData, setPostsData] = useState({ posts: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Creators
  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCoomerCreators(page, service, search, 40);
      setCreatorsData(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal memuat creators.");
    } finally {
      setLoading(false);
    }
  }, [page, service, search]);

  // Fetch Recent Posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * 30;
      const res = await getCoomerPosts(offset);
      setPostsData(res);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal memuat posts feed.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (mode === "creators") {
      fetchCreators();
    } else {
      fetchPosts();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode, fetchCreators, fetchPosts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <div className="sticky top-0 z-30 bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
            >
              <Grid size={18} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
              <Users size={18} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">Coomer.su</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Archived
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => { setMode("creators"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "creators"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Creators
          </button>
          <button
            onClick={() => { setMode("posts"); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "posts"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Feed Terbaru
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Controls: Search & Service filter (Creators mode) */}
        {mode === "creators" && (
          <div className="space-y-4">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Cari creator (nama atau username)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </form>

            {/* Service Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {SERVICES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setService(s.key); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                    service === s.key
                      ? "bg-white/10 border-rose-500/50 text-white shadow-lg shadow-rose-500/10"
                      : "bg-neutral-900/60 border-white/5 text-gray-400 hover:text-white hover:border-white/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Section */}
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-rose-500 animate-spin" />
            <p className="text-sm text-gray-400">
              {mode === "creators" ? "Memuat daftar creator..." : "Memuat feed postingan..."}
            </p>
          </div>
        ) : error ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center text-center p-6 bg-neutral-900/40 border border-red-500/20 rounded-3xl">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => mode === "creators" ? fetchCreators() : fetchPosts()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : mode === "creators" ? (
          /* Creators Grid */
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-gray-400 font-medium">
                Ditemukan <span className="text-white font-bold">{creatorsData.total?.toLocaleString() || 0}</span> creator
                {search && ` untuk "${search}"`}
              </p>
              <span className="text-xs text-gray-500">Halaman {page}</span>
            </div>

            {creatorsData.creators.length === 0 ? (
              <div className="py-20 text-center text-gray-500 text-sm">
                Tidak ada creator yang cocok dengan pencarian Anda.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {creatorsData.creators.map((c) => (
                  <motion.div
                    key={`${c.service}-${c.id}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -3 }}
                    onClick={() => navigate(`/coomer/${encodeURIComponent(c.service)}/${encodeURIComponent(c.id)}`)}
                    className="group relative bg-neutral-900/80 hover:bg-neutral-900 border border-white/5 hover:border-rose-500/30 rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20"
                  >
                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/10 group-hover:border-rose-500/50 transition-colors mb-3 relative flex-shrink-0">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600 -z-0">
                        <Users size={28} />
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 w-full group-hover:text-rose-400 transition-colors">
                      {c.name}
                    </h3>

                    {/* Service & Favs */}
                    <div className="flex items-center justify-center gap-1.5 mt-2 w-full">
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                        {c.service}
                      </span>
                      {c.favorited > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-medium">
                          <Heart size={10} className="fill-rose-500 text-rose-500" />
                          {c.favorited > 999 ? `${(c.favorited / 1000).toFixed(1)}k` : c.favorited}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-3 pt-8 pb-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <span className="text-xs font-semibold text-gray-400 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                Halaman {page}
              </span>
              <button
                disabled={!creatorsData.hasMore}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Recent Posts Feed View */
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {postsData.posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/coomer/${encodeURIComponent(post.service)}/${encodeURIComponent(post.user)}`)}
                  className="bg-neutral-900/70 border border-white/5 hover:border-rose-500/30 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-xl hover:shadow-rose-950/20 flex flex-col"
                >
                  {/* Thumbnail / Media Preview */}
                  <div className="aspect-video bg-neutral-800 relative overflow-hidden">
                    {post.thumbnail ? (
                      <img
                        src={post.thumbnail}
                        alt={post.title || post.user}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        {post.has_video ? <Video size={32} /> : <ImageIcon size={32} />}
                      </div>
                    )}
                    {/* Media Type Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] text-white font-medium border border-white/10">
                      {post.has_video && <Video size={12} className="text-rose-400" />}
                      {post.media_count > 0 && <span>{post.media_count}</span>}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                          {post.service}
                        </span>
                        <span className="text-xs font-bold text-rose-400 line-clamp-1">
                          @{post.user}
                        </span>
                      </div>
                      <p className="text-xs text-white line-clamp-2 leading-relaxed">
                        {post.title || post.content?.replace(/<[^>]*>/g, "") || "Postingan media"}
                      </p>
                    </div>
                    {post.published && (
                      <p className="text-[10px] text-gray-500 mt-3">
                        {new Date(post.published).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-3 pt-8 pb-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>
              <span className="text-xs font-semibold text-gray-400 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                Halaman {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                Selanjutnya <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
