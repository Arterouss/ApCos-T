import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  FolderArchive,
  Download,
  Image as ImageIcon,
  Video,
  FileArchive,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Calendar,
  HardDrive,
  Play,
} from "lucide-react";
import {
  getBalbumsAlbumDetail,
  getBalbumsFileDirect,
} from "../services/balbumsService";

export default function BalbumsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // "all" | "video" | "image" | "other"

  // Lightbox State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    mediaList: [],
    currentIndex: 0,
  });

  const [directLinks, setDirectLinks] = useState({}); // { [fileId]: { download_url, stream_url } }
  const [loadingDirect, setLoadingDirect] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });
  const touchEndRef = useRef({ x: 0, y: 0 });
  const thumbListRef = useRef(null);

  const fetchAlbum = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBalbumsAlbumDetail(id);
      setAlbum(data);
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Gagal memuat detail album."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlbum();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchAlbum]);

  // Filtered files
  const filteredFiles = (album?.files || []).filter((f) => {
    if (activeTab === "video") return f.isVideo;
    if (activeTab === "image") return f.isImage || (!f.isVideo && f.thumbnail);
    if (activeTab === "other") return !f.isVideo && !f.isImage;
    return true;
  });

  // Open Lightbox
  const openLightbox = (index = 0) => {
    if (!filteredFiles || filteredFiles.length === 0) return;
    setLightbox({
      isOpen: true,
      mediaList: filteredFiles,
      currentIndex: Math.max(0, Math.min(index, filteredFiles.length - 1)),
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

  // Fetch direct download link for current lightbox item if needed
  const currentMedia = lightbox.mediaList[lightbox.currentIndex];

  useEffect(() => {
    if (lightbox.isOpen && currentMedia?.id && !directLinks[currentMedia.id]) {
      setLoadingDirect(true);
      getBalbumsFileDirect(currentMedia.id)
        .then((res) => {
          setDirectLinks((prev) => ({
            ...prev,
            [currentMedia.id]: res,
          }));
        })
        .catch((e) => {
          console.warn("Could not resolve direct link:", e.message);
        })
        .finally(() => {
          setLoadingDirect(false);
        });
    }
  }, [lightbox.isOpen, currentMedia?.id, directLinks]);

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

    if (
      Math.abs(deltaX) > Math.abs(deltaY) &&
      Math.abs(deltaX) > minSwipeDistance
    ) {
      if (deltaX > 0) {
        nextMedia();
      } else {
        prevMedia();
      }
    }
  };

  const currentDirect = currentMedia ? directLinks[currentMedia.id] : null;

  return (
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-8 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/balbums")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md"
          >
            <ArrowLeft
              size={16}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Kembali ke Daftar Album
          </button>

          {album?.album_url && (
            <a
              href={album.album_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-amber-500/40 text-gray-400 hover:text-amber-300 text-xs font-semibold transition-all"
            >
              <span>Buka di Bunkr Asli</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Hero Banner */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <FolderArchive size={13} /> Album Bunkr
                </span>
                <span className="text-[11px] font-mono text-gray-400 px-2.5 py-1 rounded-full glass-card border border-white/5">
                  ID: {id}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display tracking-tight">
                {album?.title || `Album ${id}`}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card border border-amber-500/30 text-amber-300 font-semibold shadow-sm">
                  <Layers size={13} /> {album?.files?.length || 0} Total Berkas
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            {album?.files && album.files.length > 0 && (
              <button
                onClick={() => openLightbox(0)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-amber-600/25 flex items-center gap-2 cursor-pointer"
              >
                <Play size={16} className="fill-white" />
                <span>Buka Galeri & Player</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        {album?.files && album.files.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: "all", label: `Semua (${album.files.length})` },
              {
                key: "video",
                label: `Video (${album.files.filter((f) => f.isVideo).length})`,
              },
              {
                key: "image",
                label: `Gambar (${
                  album.files.filter((f) => f.isImage || (!f.isVideo && f.thumbnail)).length
                })`,
              },
              {
                key: "other",
                label: `Lainnya (${
                  album.files.filter((f) => !f.isVideo && !f.isImage).length
                })`,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                    : "glass-card text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Files Grid Section */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold">
              Memuat Berkas Album...
            </p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center rounded-3xl border border-red-500/30 max-w-md mx-auto space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchAlbum}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-semibold transition-all shadow-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl text-gray-400 text-sm max-w-md mx-auto">
            Tidak ada berkas yang cocok dengan filter ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {filteredFiles.map((file, idx) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openLightbox(idx)}
                className="glass-card border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-amber-950/20"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                  {file.thumbnail ? (
                    <img
                      src={file.thumbnail}
                      alt={file.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-3 text-center bg-neutral-900">
                      <FileArchive size={32} className="text-amber-500/40 mb-1" />
                      <span className="text-[10px] text-gray-500">Berkas</span>
                    </div>
                  )}

                  {/* Video Badge */}
                  {file.isVideo && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-amber-500/90 flex items-center justify-center shadow-lg shadow-amber-600/40 group-hover:scale-110 transition-transform">
                        <Play size={16} className="text-black fill-black ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Size Badge */}
                  {file.size && (
                    <div className="absolute bottom-2 right-2 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[9.5px] font-bold backdrop-blur-md border border-white/10">
                        {file.size}
                      </span>
                    </div>
                  )}
                </div>

                {/* Body info */}
                <div className="p-3">
                  <p className="text-[11.5px] font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-tight">
                    {file.name}
                  </p>
                  {file.date && (
                    <p className="text-[10px] text-gray-500 mt-1 truncate">
                      {file.date}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Lightbox Slider Modal */}
      <AnimatePresence>
        {lightbox.isOpen && lightbox.mediaList.length > 0 && (() => {
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
                {/* Left: Counter & File Name */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                    {currentMedia?.isVideo ? (
                      <Video size={13} />
                    ) : (
                      <ImageIcon size={13} />
                    )}
                    Berkas {lightbox.currentIndex + 1} / {totalMedia}
                  </span>
                  <span className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-md hidden xs:inline-block">
                    {currentMedia?.name}
                  </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentDirect?.download_url ? (
                    <a
                      href={currentDirect.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full glass-card hover:border-amber-500/50 text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md"
                      title="Unduh Berkas Asli"
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Unduh</span>
                    </a>
                  ) : loadingDirect ? (
                    <span className="px-3 py-1.5 rounded-full glass-card text-xs text-gray-400 flex items-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      <span className="hidden sm:inline">Menyiapkan...</span>
                    </span>
                  ) : currentMedia?.url ? (
                    <a
                      href={currentMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full glass-card hover:border-amber-500/50 text-xs font-semibold text-amber-300 hover:text-white flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Buka Sumber</span>
                    </a>
                  ) : null}

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
                {/* Previous Button */}
                {totalMedia > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevMedia();
                    }}
                    className="absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-amber-600/90 text-white backdrop-blur-md border border-white/15 hover:border-amber-500/50 transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Berkas Sebelumnya"
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
                      className="w-full h-full flex flex-col items-center justify-center"
                    >
                      {currentMedia?.isVideo ? (
                        currentDirect?.stream_url ? (
                          <video
                            src={currentDirect.stream_url}
                            controls
                            autoPlay
                            playsInline
                            className="max-h-[72vh] sm:max-h-[78vh] max-w-full rounded-2xl shadow-2xl border border-white/10 bg-black"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-3 p-6 glass-card rounded-2xl border border-white/10 max-w-md text-center">
                            {currentMedia.thumbnail && (
                              <img
                                src={currentMedia.thumbnail}
                                alt={currentMedia.name}
                                className="w-48 h-32 object-cover rounded-xl border border-white/10 mb-2"
                              />
                            )}
                            <h4 className="text-sm font-bold text-white break-all">
                              {currentMedia.name}
                            </h4>
                            <p className="text-xs text-gray-400">
                              Ukuran: {currentMedia.size || "-"}
                            </p>
                            {loadingDirect ? (
                              <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Menghubungkan link video Bunkr...</span>
                              </div>
                            ) : (
                              <a
                                href={currentMedia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg"
                              >
                                <ExternalLink size={14} /> Tonton di Bunkr
                              </a>
                            )}
                          </div>
                        )
                      ) : currentMedia?.thumbnail ? (
                        <img
                          src={currentMedia.thumbnail}
                          alt={currentMedia.name || `Foto ${lightbox.currentIndex + 1}`}
                          draggable={false}
                          className="max-h-[72vh] sm:max-h-[78vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-auto"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 glass-card rounded-2xl border border-white/10 text-center max-w-sm">
                          <FileArchive size={48} className="text-amber-400" />
                          <p className="font-semibold text-xs text-white break-all">
                            {currentMedia?.name}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Ukuran: {currentMedia?.size || "-"}
                          </p>
                          {currentDirect?.download_url ? (
                            <a
                              href={currentDirect.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs flex items-center gap-2"
                            >
                              <Download size={13} /> Unduh Berkas
                            </a>
                          ) : (
                            <a
                              href={currentMedia?.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2"
                            >
                              <ExternalLink size={13} /> Buka Halaman Berkas
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Next Button */}
                {totalMedia > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextMedia();
                    }}
                    className="absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-amber-600/90 text-white backdrop-blur-md border border-white/15 hover:border-amber-500/50 transition-all shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Berkas Selanjutnya"
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
                  <span>Geser layar ↔ atau gunakan panah untuk berpindah berkas</span>
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
                              ? "border-2 border-amber-500 scale-105 shadow-lg shadow-amber-600/40 opacity-100 ring-2 ring-amber-500/40"
                              : "border border-white/10 opacity-40 hover:opacity-85 hover:border-white/30"
                          }`}
                        >
                          {m.thumbnail ? (
                            <img
                              src={m.thumbnail}
                              alt={`Thumbnail ${idx + 1}`}
                              loading="lazy"
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-gray-600">
                              <FileArchive size={14} />
                            </div>
                          )}
                          {m.isVideo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play size={12} className="text-white fill-white" />
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
