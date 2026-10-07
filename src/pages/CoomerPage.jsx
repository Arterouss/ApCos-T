import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Users, Loader2, ChevronLeft, ChevronRight,
  Heart, Sparkles, Image as ImageIcon, Video, Filter, Grid, Flame
} from "lucide-react";
import { getCoomerCreators, getCoomerPosts } from "../services/coomerService";
import { usePersistentState } from "../hooks/usePersistentState";

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
  const [search, setSearch] = usePersistentState("coomer_search", "");
  const [searchInput, setSearchInput] = useState(search);
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
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10">
        {/* Top Navbar */}
        <div
          className="sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 transition-all"
          style={{
            background: 'rgba(7, 7, 12, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="flex items-center gap-3">
            {onOpenSidebar && (
              <button
                onClick={onOpenSidebar}
                className="md:hidden p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-all cursor-pointer"
              >
                <Grid size={18} />
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 45, 85, 0.2), rgba(124, 77, 255, 0.2))',
                  border: '1px solid rgba(255, 45, 85, 0.3)',
                }}
              >
                <Users size={18} className="text-neon-red" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-display font-black text-white tracking-tight">
                    Coomer.su
                  </h1>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: 'rgba(255, 45, 85, 0.1)',
                      color: '#ff2d55',
                      border: '1px solid rgba(255, 45, 85, 0.25)',
                    }}
                  >
                    Archive
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          <div
            className="flex items-center p-1 rounded-xl text-xs"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              onClick={() => { setMode("creators"); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                mode === "creators" ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
              style={{
                background: mode === "creators"
                  ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                  : 'transparent',
                boxShadow: mode === "creators" ? '0 0 15px rgba(255, 45, 85, 0.35)' : 'none',
              }}
            >
              Creators
            </button>
            <button
              onClick={() => { setMode("posts"); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all duration-300 cursor-pointer ${
                mode === "posts" ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
              style={{
                background: mode === "posts"
                  ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                  : 'transparent',
                boxShadow: mode === "posts" ? '0 0 15px rgba(255, 45, 85, 0.35)' : 'none',
              }}
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
                  className="w-full rounded-2xl pl-11 pr-10 py-3 text-sm text-white placeholder-gray-500 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 45, 85, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
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
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      service === s.key ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      background: service === s.key
                        ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: service === s.key
                        ? '1px solid rgba(255, 45, 85, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: service === s.key ? '0 0 15px rgba(255, 45, 85, 0.3)' : 'none',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Content Section */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl p-4 flex flex-col items-center gap-3"
                  style={{
                    background: 'rgba(14, 16, 26, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="w-20 h-20 rounded-full bg-white/[0.04] animate-pulse" />
                  <div className="h-4 bg-white/[0.05] rounded-md w-3/4 animate-pulse" />
                  <div className="h-3 bg-white/[0.03] rounded-md w-1/2 animate-pulse" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="min-h-[40vh] flex flex-col items-center justify-center text-center p-8 rounded-3xl max-w-md mx-auto"
              style={{
                background: 'rgba(18, 18, 28, 0.5)',
                border: '1px solid rgba(255, 45, 85, 0.2)',
              }}
            >
              <p className="text-neon-red text-sm mb-4">{error}</p>
              <button
                onClick={() => mode === "creators" ? fetchCreators() : fetchPosts()}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer"
                style={{ background: '#ff2d55' }}
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
                <span className="text-xs text-gray-500 font-mono">Halaman {page}</span>
              </div>

              {creatorsData.creators.length === 0 ? (
                <div
                  className="py-20 text-center rounded-3xl p-8 max-w-md mx-auto"
                  style={{
                    background: 'rgba(14, 16, 26, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <p className="text-gray-400 text-sm">Tidak ada creator yang cocok.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {creatorsData.creators.map((c) => (
                    <motion.div
                      key={`${c.service}-${c.id}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      onClick={() => navigate(`/coomer/${encodeURIComponent(c.service)}/${encodeURIComponent(c.id)}`)}
                      className="group relative rounded-2xl p-4 flex flex-col items-center text-center cursor-pointer transition-all duration-300"
                      style={{
                        background: 'rgba(14, 16, 26, 0.6)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.35)';
                        e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 45, 85, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Avatar */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-neutral-800 border-2 border-white/10 group-hover:border-rose-500/50 transition-colors mb-3 relative shrink-0">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-gray-600 -z-0">
                          <Users size={28} />
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 w-full group-hover:text-neon-red transition-colors">
                        {c.name}
                      </h3>

                      {/* Service & Favs */}
                      <div className="flex items-center justify-center gap-1.5 mt-2 w-full">
                        <span
                          className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-gray-300"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          {c.service}
                        </span>
                        {c.favorited > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-neon-red font-medium">
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
              <div className="flex items-center justify-center gap-3 pt-10 pb-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span
                  className="text-xs font-mono font-semibold text-gray-300 px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  Halaman {page}
                </span>
                <button
                  disabled={!creatorsData.hasMore}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
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
                    className="rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 flex flex-col"
                    style={{
                      background: 'rgba(14, 16, 26, 0.6)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.35)';
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 45, 85, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Thumbnail / Media Preview */}
                    <div className="aspect-video bg-neutral-900 relative overflow-hidden">
                      {post.thumbnail ? (
                        <img
                          src={post.thumbnail}
                          alt={post.title || post.user}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                          {post.has_video ? <Video size={32} /> : <ImageIcon size={32} />}
                        </div>
                      )}
                      {/* Media Type Badge */}
                      <div
                        className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] text-white font-medium"
                        style={{
                          background: 'rgba(0, 0, 0, 0.65)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        {post.has_video && <Video size={11} className="text-neon-red" />}
                        {post.media_count > 0 && <span>{post.media_count}</span>}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full text-gray-300"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}
                          >
                            {post.service}
                          </span>
                          <span className="text-xs font-bold text-neon-red line-clamp-1">
                            @{post.user}
                          </span>
                        </div>
                        <p className="text-xs text-gray-200 line-clamp-2 leading-relaxed">
                          {post.title || post.content?.replace(/<[^>]*>/g, "") || "Postingan media"}
                        </p>
                      </div>
                      {post.published && (
                        <p className="text-[10px] text-gray-500 mt-3 font-mono">
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
              <div className="flex items-center justify-center gap-3 pt-10 pb-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <span
                  className="text-xs font-mono font-semibold text-gray-300 px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  Halaman {page}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
