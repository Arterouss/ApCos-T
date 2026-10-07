import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  X,
  Eye,
  Video,
  Image as ImageIcon,
  FileText,
  Download,
  Sparkles,
  Calendar,
} from "lucide-react";

const isVideo = (path = "") => {
  return /\.(mp4|webm|m4v|mov|avi|mkv)$/i.test(path);
};

const isImage = (path = "") => {
  return /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(path);
};

// Official direct CDN media url from Pawchive (auto-routes video vs image)
const getMediaUrl = (path, type = "auto") => {
  if (!path) return "";
  if (isVideo(path) && type !== "thumb") {
    return `https://file.pawchive.st/data${path}`;
  }
  return `https://img.pawchive.st/thumbnail/data${path}`;
};

// Fallback proxy url in case direct CDN is restricted by ISP/client
const getProxyUrl = (path) => {
  if (!path) return "";
  return `/api/media/pawchive?path=${encodeURIComponent(path)}`;
};

const CreatorPosts = () => {
  const { service, id } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${service}/${id}`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          "Failed to load posts. Make sure the proxy is running and the creator exists."
        );
        setLoading(false);
      }
    };
    fetchPosts();
  }, [service, id]);

  const getAllMedia = (post) => {
    if (!post) return [];
    const items = [post.file, ...(post.attachments || [])].filter(
      (item) => item && item.path
    );
    const unique = [];
    const paths = new Set();
    items.forEach((item) => {
      if (!paths.has(item.path)) {
        paths.add(item.path);
        unique.push(item);
      }
    });
    return unique;
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={18} className="text-purple-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-purple-300">
          Memuat Arsip Pawchive...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen pb-24 text-white">
      {/* Top Nav */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-purple-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold mb-8 transition-all group shadow-md"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>

      {error ? (
        <div className="glass-card text-center p-8 rounded-3xl border border-red-500/30 max-w-md mx-auto my-12">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      ) : (
        <>
          {/* Hero Banner Card */}
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={12} className="text-purple-400" />
                  Pawchive Archive
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                  Postingan dari {service.charAt(0).toUpperCase() + service.slice(1)}
                </h1>
                <p className="text-xs text-purple-300 font-mono mt-1">ID: @{id}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-full glass-card border border-white/10 text-xs font-semibold text-gray-300">
                  {posts.length} Postingan
                </span>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => {
              const mediaCount =
                (post.file?.path ? 1 : 0) + (post.attachments?.length || 0);
              const hasVideo =
                isVideo(post.file?.path) ||
                post.attachments?.some((a) => isVideo(a.path));

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col justify-between"
                >
                  {/* Thumbnail / Preview Header */}
                  <div className="bg-neutral-950 relative aspect-video flex items-center justify-center overflow-hidden">
                    {post.file && post.file.path ? (
                      isVideo(post.file.path) ? (
                        <video
                          src={getMediaUrl(post.file.path, "file")}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          loop
                          playsInline
                          onMouseOver={(e) => e.target.play().catch(() => {})}
                          onMouseOut={(e) => e.target.pause()}
                          onError={(e) => {
                            if (!e.target.dataset.fallback) {
                              e.target.dataset.fallback = "true";
                              e.target.src = getProxyUrl(post.file.path);
                            } else {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950/40 to-neutral-950 gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#f87171' stroke-width='2'><polygon points='23 7 16 12 23 17 23 7'/><rect x='1' y='5' width='15' height='14' rx='2' ry='2'/></svg><span style='font-size:11px;color:#f87171;'>Video Attached</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={getMediaUrl(post.file.path, "thumb")}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => {
                            if (!e.target.dataset.fallback) {
                              e.target.dataset.fallback = "true";
                              e.target.src = getProxyUrl(post.file.path);
                            } else {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/30 to-neutral-950 gap-2"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#a78bfa' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg><span style='font-size:11px;color:#a78bfa;'>Preview restricted</span></div>`;
                            }
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-neutral-900 gap-2">
                        <FileText size={32} />
                        <span className="text-xs">Text / No Preview</span>
                      </div>
                    )}

                    {/* Media Type Badges */}
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
                      {hasVideo && (
                        <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md shadow-md">
                          <Video size={11} /> VIDEO
                        </span>
                      )}
                      {mediaCount > 1 && (
                        <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-md shadow-md">
                          <ImageIcon size={11} /> +{mediaCount - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {post.title || "Untitled Post"}
                      </h3>

                      {/* Tags */}
                      {post.tags && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {(Array.isArray(post.tags)
                            ? post.tags
                            : post.tags.split(/[ ,]+/).filter((t) => t)
                          )
                            .slice(0, 3)
                            .map((tag, idx) => (
                              <span
                                key={idx}
                                className="glass-card text-gray-300 text-[10px] px-2 py-0.5 rounded-md border border-white/5"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-purple-400" />
                          {new Date(post.published).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-medium">
                          {mediaCount > 0 ? `${mediaCount} Berkas` : "Teks"}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/20 transition-all cursor-pointer"
                        >
                          <Eye size={13} /> Lihat Media
                        </button>

                        <a
                          href={`https://pawchive.st/${service}/user/${id}/post/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full glass-card hover:border-purple-500/40 text-gray-300 hover:text-white border border-white/10 text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ExternalLink size={13} /> Sumber
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Fullscreen Media & Content Viewer Modal */}
          <AnimatePresence>
            {selectedPost && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto"
                onClick={() => setSelectedPost(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="glass-card border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-500/20 relative"
                >
                  {/* Modal Header */}
                  <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-start gap-4 bg-neutral-950/60">
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-white mb-1">
                        {selectedPost.title || "Untitled Post"}
                      </h2>
                      <p className="text-xs text-gray-400">
                        Dipublikasikan pada{" "}
                        {new Date(selectedPost.published).toLocaleDateString(
                          "id-ID",
                          {
                            dateStyle: "long",
                          }
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="p-2 rounded-full glass-card hover:border-purple-500/40 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-grow">
                    {/* HTML Content */}
                    {selectedPost.content && (
                      <div className="glass-card p-4 rounded-2xl border border-white/5 text-gray-300 text-xs sm:text-sm leading-relaxed overflow-x-auto">
                        <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                          Deskripsi Postingan:
                        </h4>
                        <div
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: selectedPost.content,
                          }}
                        />
                      </div>
                    )}

                    {/* Media Gallery Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="text-purple-400" size={16} />
                        Berkas Media Lampiran ({getAllMedia(selectedPost).length})
                      </h4>

                      {getAllMedia(selectedPost).length === 0 ? (
                        <div className="text-center py-10 text-gray-500 glass-card rounded-2xl border border-white/5">
                          Tidak ada lampiran media pada postingan ini.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {getAllMedia(selectedPost).map((media, idx) => {
                            const url = getMediaUrl(media.path, "file");
                            const isVid = isVideo(media.path);
                            const isImg = isImage(media.path);
                            const fname =
                              media.name ||
                              media.path.split("/").pop() ||
                              `Lampiran #${idx + 1}`;

                            return (
                              <div
                                key={idx}
                                className="glass-card p-4 rounded-2xl border border-white/10 flex flex-col items-center group shadow-xl"
                              >
                                {isVid ? (
                                  <div className="w-full">
                                    <video
                                      src={url}
                                      controls
                                      className="w-full max-h-[75vh] rounded-xl bg-black mx-auto shadow-lg"
                                      playsInline
                                      onError={(e) => {
                                        if (!e.target.dataset.fallback) {
                                          e.target.dataset.fallback = "true";
                                          e.target.src = getProxyUrl(media.path);
                                        }
                                      }}
                                    />
                                  </div>
                                ) : isImg ? (
                                  <div className="w-full flex justify-center bg-black/40 rounded-xl p-2">
                                    <img
                                      src={url}
                                      alt={fname}
                                      className="max-h-[75vh] w-auto object-contain rounded-xl shadow-lg"
                                      loading="lazy"
                                      onError={(e) => {
                                        if (!e.target.dataset.fallback) {
                                          e.target.dataset.fallback = "true";
                                          e.target.src = getProxyUrl(media.path);
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full py-8 px-4 flex flex-col items-center justify-center gap-3 text-center rounded-xl bg-neutral-900/50">
                                    <FileText size={44} className="text-purple-400" />
                                    <div>
                                      <p className="font-semibold text-white text-xs break-all">
                                        {fname}
                                      </p>
                                      <p className="text-[11px] text-gray-500 mt-0.5">
                                        Berkas Arsip / Dokumen
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* File Bar */}
                                <div className="w-full flex flex-wrap justify-between items-center mt-3 pt-3 border-t border-white/5 gap-2 px-1">
                                  <span
                                    className="text-xs text-gray-400 font-mono truncate max-w-[60%]"
                                    title={fname}
                                  >
                                    {fname}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download
                                      className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors font-medium"
                                    >
                                      <Download size={13} /> Unduh
                                    </a>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default CreatorPosts;
