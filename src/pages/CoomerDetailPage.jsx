import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Gallery Lightbox state
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    mediaList: [],
    currentIndex: 0,
    postTitle: "",
  });

  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  const thumbListRef = useRef(null);

  const openLightbox = (mediaList, startIndex = 0, title = "") => {
    if (!mediaList || mediaList.length === 0) return;
    const formatted = mediaList.map((m) => {
      const isVideo = ["mp4", "webm", "mov", "m4v", "avi"].some((ext) =>
        (m.path || m.name || m.url || "").toLowerCase().endsWith(ext)
      );
      return { ...m, isVideo };
    });
    setLightbox({
      isOpen: true,
      mediaList: formatted,
      currentIndex: Math.max(0, Math.min(startIndex, formatted.length - 1)),
      postTitle: title || "",
    });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, isOpen: false }));
  };

  const nextMedia = useCallback(() => {
    setLightbox((prev) => {
      if (!prev.isOpen || prev.mediaList.length <= 1) return prev;
      const nextIdx = (prev.currentIndex + 1) % prev.mediaList.length;
      return { ...prev, currentIndex: nextIdx };
    });
  }, []);

  const prevMedia = useCallback(() => {
    setLightbox((prev) => {
      if (!prev.isOpen || prev.mediaList.length <= 1) return prev;
      const prevIdx =
        (prev.currentIndex - 1 + prev.mediaList.length) % prev.mediaList.length;
      return { ...prev, currentIndex: prevIdx };
    });
  }, []);

  const goToMedia = (index) => {
    setLightbox((prev) => ({
      ...prev,
      currentIndex: Math.max(0, Math.min(index, prev.mediaList.length - 1)),
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightbox.isOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightbox.isOpen, nextMedia, prevMedia]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (lightbox.isOpen && thumbListRef.current) {
      const activeEl = thumbListRef.current.children[lightbox.currentIndex];
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [lightbox.currentIndex, lightbox.isOpen]);

  // Touch swipe gesture handlers (mobile friendly)
  const handleTouchStart = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e) => {
    if (!e.targetTouches || e.targetTouches.length === 0) return;
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartRef.current.x - touchEndRef.current.x;
    const deltaY = touchStartRef.current.y - touchEndRef.current.y;
    const minSwipeDistance = 40;

    // Trigger only if swipe is predominantly horizontal and exceeds threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left -> next photo
        nextMedia();
      } else {
        // Swiped right -> previous photo
        prevMedia();
      }
    }
  };

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
                      <div className="space-y-2.5 mt-1">
                        <div
                          className={`grid gap-2 ${
                            allMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
                          }`}
                        >
                          {allMedia.slice(0, 4).map((m, idx) => {
                            const isVideo = ["mp4", "webm", "mov", "m4v", "avi"].some((ext) =>
                              (m.path || m.name || m.url || "").toLowerCase().endsWith(ext)
                            );
                            const isLastPreview = idx === 3 && allMedia.length > 4;
                            const remainingCount = allMedia.length - 4;

                            return (
                              <div
                                key={idx}
                                onClick={() => openLightbox(allMedia, idx, post.title)}
                                className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-900 cursor-pointer group border border-white/5 hover:border-rose-500/50 transition-all shadow-md"
                              >
                                <img
                                  src={m.url}
                                  alt={m.name || "Media"}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {isVideo && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full bg-rose-600/90 flex items-center justify-center shadow-lg shadow-rose-600/40">
                                      <Video size={18} className="text-white" />
                                    </div>
                                  </div>
                                )}
                                {isLastPreview && (
                                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white backdrop-blur-sm group-hover:bg-black/70 transition-all p-2 text-center">
                                    <span className="font-extrabold text-sm sm:text-base text-rose-300 drop-shadow">
                                      +{remainingCount} Lainnya
                                    </span>
                                    <span className="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1 font-medium">
                                      <ImageIcon size={10} /> Ketuk untuk lihat semua
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick button to view all media in gallery slider if multiple */}
                        {allMedia.length > 1 && (
                          <button
                            type="button"
                            onClick={() => openLightbox(allMedia, 0, post.title)}
                            className="w-full py-2 px-3 rounded-xl glass-card hover:border-rose-500/40 border border-white/10 text-xs font-semibold text-rose-300 hover:text-white flex items-center justify-center gap-2 transition-all group/btn cursor-pointer"
                          >
                            <ImageIcon size={13} className="text-rose-400 group-hover/btn:scale-110 transition-transform" />
                            <span>Buka Galeri Foto ({allMedia.length} Media)</span>
                            <ChevronRight size={13} className="text-gray-400 group-hover/btn:translate-x-0.5 transition-transform" />
                          </button>
                        )}
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

      {/* Interactive Lightbox Slider Modal */}
      <AnimatePresence>
        {lightbox.isOpen && lightbox.mediaList.length > 0 && (() => {
          const currentMedia = lightbox.mediaList[lightbox.currentIndex];
          const totalMedia = lightbox.mediaList.length;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col select-none touch-pan-y"
              onClick={closeLightbox}
            >
              {/* Top Header Bar */}
              <div
                className="w-full px-4 py-3 sm:px-6 flex items-center justify-between border-b border-white/10 bg-neutral-950/80 z-20 backdrop-blur-md"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left: Counter & Title */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                    <ImageIcon size={13} />
                    Foto {lightbox.currentIndex + 1} / {totalMedia}
                  </span>
                  {lightbox.postTitle && (
                    <span className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-md hidden xs:inline-block">
                      {lightbox.postTitle}
                    </span>
                  )}
                </div>

                {/* Right: Actions (Download & Close) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentMedia?.url && (
                    <a
                      href={currentMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full glass-card hover:border-rose-500/50 text-xs font-semibold text-rose-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md"
                      title="Unduh Berkas Asli"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Unduh</span>
                    </a>
                  )}
                  <button
                    onClick={closeLightbox}
                    className="p-2 rounded-full glass-card hover:bg-white/15 text-gray-300 hover:text-white transition-all cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Center Main Stage (Swipeable Viewport) */}
              <div
                className="relative flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden"
                onClick={closeLightbox}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Previous Button (Desktop & Mobile) */}
                {totalMedia > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevMedia();
                    }}
                    className="absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-rose-600/90 text-white backdrop-blur-md border border-white/15 hover:border-rose-500/50 transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Foto Sebelumnya"
                  >
                    <ChevronLeft size={22} className="sm:w-6 sm:h-6" />
                  </button>
                )}

                {/* Media Centerpiece */}
                <div
                  className="w-full h-full flex flex-col items-center justify-center max-h-[75vh] sm:max-h-[78vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={lightbox.currentIndex}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {currentMedia?.isVideo ? (
                        <video
                          src={currentMedia.url}
                          controls
                          autoPlay
                          playsInline
                          className="max-h-[72vh] sm:max-h-[78vh] max-w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
                        />
                      ) : (
                        <img
                          src={currentMedia?.url}
                          alt={currentMedia?.name || `Foto ${lightbox.currentIndex + 1}`}
                          draggable={false}
                          className="max-h-[72vh] sm:max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-auto"
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Next Button (Desktop & Mobile) */}
                {totalMedia > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextMedia();
                    }}
                    className="absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-rose-600/90 text-white backdrop-blur-md border border-white/15 hover:border-rose-500/50 transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Foto Selanjutnya"
                  >
                    <ChevronRight size={22} className="sm:w-6 sm:h-6" />
                  </button>
                )}
              </div>

              {/* Mobile Swipe Hint */}
              {totalMedia > 1 && (
                <div
                  className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pb-1 px-4 z-10 pointer-events-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Geser layar ↔ atau gunakan tombol panah untuk melihat foto lain</span>
                </div>
              )}

              {/* Bottom Thumbnail Strip Carousel */}
              {totalMedia > 1 && (
                <div
                  className="w-full py-2.5 px-3 bg-neutral-950/90 border-t border-white/10 z-20 backdrop-blur-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    ref={thumbListRef}
                    className="flex items-center gap-2 overflow-x-auto max-w-5xl mx-auto py-1 px-2 scroll-smooth"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {lightbox.mediaList.map((m, idx) => {
                      const isActive = idx === lightbox.currentIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => goToMedia(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "border-2 border-rose-500 scale-105 shadow-lg shadow-rose-600/40 opacity-100 ring-2 ring-rose-500/40"
                              : "border border-white/10 opacity-40 hover:opacity-85 hover:border-white/30"
                          }`}
                        >
                          <img
                            src={m.url}
                            alt={`Thumbnail ${idx + 1}`}
                            loading="lazy"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          {m.isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Video size={12} className="text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white drop-shadow bg-black/60 px-1 rounded">
                            {idx + 1}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
