import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ExternalLink, Loader2, Users, Heart,
  Image as ImageIcon, Video, X, ChevronLeft, ChevronRight, Download
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
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-neutral-950/85 backdrop-blur-xl border-b border-white/5 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-bold text-sm text-white line-clamp-1">{profile?.name || id}</h1>
            <span className="text-[10px] uppercase font-semibold text-rose-400">{service}</span>
          </div>
        </div>

        {profile?.url && (
          <a
            href={profile.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition-all flex items-center gap-1.5 text-xs"
            title="Buka di Coomer.st"
          >
            <span className="hidden sm:inline">Web Sumber</span>
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
        {/* Creator Hero Banner & Info */}
        <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl">
          {/* Avatar */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-neutral-800 border-4 border-rose-500/30 flex-shrink-0 shadow-xl shadow-rose-950/30 relative">
            <img
              src={`/api/coomer/media?icon=1&service=${encodeURIComponent(service)}&id=${encodeURIComponent(id)}`}
              alt={profile?.name || id}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 -z-0">
              <Users size={36} />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">{profile?.name || id}</h2>
              <span className="self-center sm:self-auto text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {service}
              </span>
            </div>

            <p className="text-xs text-gray-400">@{id}</p>

            <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
              {profile?.favorited > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-rose-400">
                  <Heart size={14} className="fill-rose-500" />
                  {profile.favorited.toLocaleString()} Favorites
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300">
                {posts.length} Postingan di halaman ini
              </span>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          <h3 className="text-base font-bold text-white mb-4">Galeri Postingan</h3>

          {loading ? (
            <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
              <Loader2 size={36} className="text-rose-500 animate-spin" />
              <p className="text-xs text-gray-400">Memuat postingan...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-neutral-900/50 border border-red-500/20 rounded-2xl">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button
                onClick={fetchPosts}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Coba Lagi
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="py-20 text-center text-gray-500 text-sm">
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
                    className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg"
                  >
                    {/* Post Content / Caption */}
                    <div>
                      {post.title && (
                        <h4 className="font-bold text-sm text-white mb-1.5">{post.title}</h4>
                      )}
                      {post.content && (
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3 mb-3">
                          {post.content.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                      {post.published && (
                        <p className="text-[10px] text-gray-500">
                          {new Date(post.published).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Media Grid inside the post card */}
                    {allMedia.length > 0 && (
                      <div className={`grid gap-2 ${allMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} mt-2`}>
                        {allMedia.slice(0, 4).map((m, idx) => {
                          const isVideo = ['mp4', 'webm', 'mov', 'm4v'].some(ext => (m.path || m.name || '').endsWith(ext));
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedMedia({ ...m, isVideo })}
                              className="relative aspect-square rounded-xl overflow-hidden bg-neutral-800 cursor-pointer group border border-white/5 hover:border-rose-500/50 transition-colors"
                            >
                              <img
                                src={m.url}
                                alt={m.name || "Media"}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {isVideo && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg">
                                    <Video size={18} className="text-white" />
                                  </div>
                                </div>
                              )}
                              {idx === 3 && allMedia.length > 4 && (
                                <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-white font-bold text-sm">
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
              disabled={!hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
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
              className="max-w-4xl max-h-[90vh] flex flex-col items-center"
            >
              {selectedMedia.isVideo ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl"
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt={selectedMedia.name}
                  className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
                />
              )}
              {selectedMedia.name && (
                <p className="text-xs text-gray-400 mt-3 text-center">{selectedMedia.name}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
