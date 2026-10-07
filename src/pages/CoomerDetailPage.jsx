import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Users,
  Heart,
  Image as ImageIcon,
  Video,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  Calendar,
} from "lucide-react";
import { getCoomerCreatorPosts, getCoomerCreatorProfile } from "../services/coomerService";

export default function CoomerDetailPage() {
  const { service, id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal Lightbox state
  const [selectedMedia, setSelectedMedia] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getCoomerCreatorProfile(service, id);
      setProfile(data);
    } catch (e) {
      console.warn("Failed to fetch creator profile:", e.message);
    }
  }, [service, id]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * 25;
      const res = await getCoomerCreatorPosts(service, id, offset);
      setPosts(res.posts || []);
      setHasMore(res.hasMore);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Gagal memuat postingan creator.");
    } finally {
      setLoading(false);
    }
  }, [service, id, page]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchPosts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchPosts]);

  return (
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>

          {profile?.url && (
            <a
              href={profile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 text-xs font-semibold transition-all"
            >
              <span>Buka Web Sumber</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Creator Hero Banner Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden glass-card border-2 border-rose-500/40 flex-shrink-0 shadow-xl shadow-rose-950/40 relative group">
              <img
                src={`/api/coomer/media?icon=1&service=${encodeURIComponent(service)}&id=${encodeURIComponent(id)}`}
                alt={profile?.name || id}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center text-gray-600 -z-0">
                <Users size={36} />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white font-display">
                  {profile?.name || id}
                </h1>
                <span className="self-center sm:self-auto text-[11px] uppercase font-bold px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  {service}
                </span>
              </div>

              <p className="text-xs text-gray-400 font-mono">ID: @{id}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs">
                {profile?.favorited > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border border-rose-500/30 text-rose-300 font-semibold shadow-md">
                    <Heart size={14} className="fill-rose-500 text-rose-500" />
                    {profile.favorited.toLocaleString()} Menyukai
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full glass-card border border-white/10 text-gray-300 font-medium">
                  {posts.length} Postingan di Halaman Ini
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-rose-400" /> Arsip Postingan
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              Halaman {page}
            </span>
          </div>

          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
              <p className="text-xs text-rose-300 uppercase tracking-widest font-semibold">
                Memuat Postingan...
              </p>
            </div>
          ) : error ? (
            <div className="glass-card p-8 text-center rounded-3xl border border-rose-500/30 max-w-md mx-auto">
              <p className="text-rose-400 text-sm mb-4">{error}</p>
              <button
                onClick={fetchPosts}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-semibold transition-all shadow-lg shadow-rose-600/30"
              >
                Coba Lagi
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl text-gray-500 text-sm max-w-md mx-auto">
              Belum ada postingan media dari creator ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const allMedia = [...(post.images || []), ...(post.videos || [])];
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card border border-white/10 hover:border-rose-500/40 rounded-3xl p-5 flex flex-col justify-between gap-4 shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Caption Header */}
                    <div>
                      {post.title && (
                        <h3 className="font-bold text-sm text-white mb-1.5 line-clamp-2">
                          {post.title}
                        </h3>
                      )}
                      {post.content && (
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3 mb-3">
                          {post.content.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                      {post.published && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Calendar size={11} className="text-rose-400" />
                          <span>
                            {new Date(post.published).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Media Grid Preview */}
                    {allMedia.length > 0 && (
                      <div
                        className={`grid gap-2 ${
                          allMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        } mt-1`}
                      >
                        {allMedia.slice(0, 4).map((m, idx) => {
                          const isVideo = ["mp4", "webm", "mov", "m4v"].some((ext) =>
                            (m.path || m.name || "").endsWith(ext)
                          );
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedMedia({ ...m, isVideo })}
                              className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer group border border-white/5 hover:border-rose-500/50 transition-all"
                            >
                              <img
                                src={m.url}
                                alt={m.name || "Media"}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg shadow-rose-600/40">
                                    <Video size={18} className="text-white" />
                                  </div>
                                </div>
                              )}
                              {idx === 3 && allMedia.length > 4 && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-bold text-xs backdrop-blur-sm">
                                  +{allMedia.length - 4} Lainnya
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-10 pb-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-5 py-2.5 glass-card hover:border-rose-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <span className="text-xs font-bold text-rose-300 px-4 py-2 glass-card rounded-full border border-rose-500/30">
              Halaman {page}
            </span>
            <button
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="px-5 py-2.5 glass-card hover:border-rose-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md"
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-10"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              {selectedMedia.isVideo ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl border border-white/10"
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              )}
              {selectedMedia.url && (
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href={selectedMedia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full glass-card hover:border-rose-500/50 text-xs font-semibold text-rose-300 flex items-center gap-1.5 transition-all"
                  >
                    <Download size={13} /> Unduh Berkas Asli
                  </a>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
