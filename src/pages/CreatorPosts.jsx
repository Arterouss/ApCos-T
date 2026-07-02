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
  Download,
  FileText,
} from "lucide-react";

const MEDIA_BASE = "https://img.pawchive.st";

const isVideo = (path = "") => {
  return /\.(mp4|webm|m4v|mov|avi|mkv)$/i.test(path);
};

const isImage = (path = "") => {
  return /\.(jpg|jpeg|png|gif|webp|avif|bmp)$/i.test(path);
};

const CreatorPosts = () => {
  const { service, id } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
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
    // Remove duplicates based on path
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
      <div className="min-h-screen flex justify-center items-center bg-neutral-950">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      <Link
        to="/"
        className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/30"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Creators
      </Link>

      {error ? (
        <div className="text-center text-red-400 text-xl mt-20 bg-red-950/20 p-8 rounded-2xl border border-red-500/30">
          {error}
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-md"
          >
            <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2">
              Posts from {service.charAt(0).toUpperCase() + service.slice(1)}{" "}
              User
            </h1>
            <p className="text-lg text-gray-400 font-mono">ID: {id}</p>
          </motion.div>

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
                  className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group flex flex-col"
                >
                  {/* Thumbnail / Preview Header */}
                  <div className="bg-neutral-950 relative aspect-video flex items-center justify-center overflow-hidden">
                    {post.file && post.file.path ? (
                      isVideo(post.file.path) ? (
                        <video
                          src={`${MEDIA_BASE}${post.file.path}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          muted
                          loop
                          playsInline
                          onMouseOver={(e) => e.target.play()}
                          onMouseOut={(e) => e.target.pause()}
                        />
                      ) : (
                        <img
                          src={`${MEDIA_BASE}${post.file.path}`}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 bg-neutral-900 gap-2">
                        <FileText size={32} />
                        <span className="text-xs">Text / No Preview</span>
                      </div>
                    )}

                    {/* Media Type Badges */}
                    <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                      {hasVideo && (
                        <span className="bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-md">
                          <Video size={12} /> VIDEO
                        </span>
                      )}
                      {mediaCount > 1 && (
                        <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm shadow-md">
                          <ImageIcon size={12} /> +{mediaCount - 1}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {post.title || "Untitled Post"}
                      </h3>

                      {/* Tags Section */}
                      {post.tags && (
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(Array.isArray(post.tags)
                            ? post.tags
                            : post.tags.split(/[ ,]+/).filter((t) => t)
                          )
                            .slice(0, 4)
                            .map((tag, idx) => (
                              <span
                                key={idx}
                                className="bg-white/5 text-gray-300 border border-white/5 text-[11px] px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>
                          {new Date(post.published).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="bg-purple-950/60 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
                          {mediaCount > 0 ? `${mediaCount} Files` : "Text Post"}
                        </span>
                      </div>

                      {/* Interactive Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setSelectedPost(post)}
                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/20 transition-all cursor-pointer"
                        >
                          <Eye size={14} /> View Media
                        </button>

                        <a
                          href={`https://pawchive.st/${service}/user/${id}/post/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          <ExternalLink size={14} /> Original
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
                className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto"
                onClick={() => setSelectedPost(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-neutral-900 border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-500/10 relative"
                >
                  {/* Modal Header */}
                  <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-start gap-4 bg-neutral-950/50">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                        {selectedPost.title || "Untitled Post"}
                      </h2>
                      <p className="text-xs text-gray-400">
                        Published on{" "}
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
                      className="bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white p-2 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Modal Body (Scrollable) */}
                  <div className="p-4 md:p-6 overflow-y-auto space-y-8 flex-grow">
                    {/* HTML Content / Description if available */}
                    {selectedPost.content && (
                      <div className="bg-neutral-950/80 p-4 rounded-xl border border-white/5 text-gray-300 text-sm md:text-base leading-relaxed overflow-x-auto">
                        <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
                          Post Description / Content:
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
                        <ImageIcon className="text-purple-400" size={18} />
                        Attached Media & Files (
                        {getAllMedia(selectedPost).length})
                      </h4>

                      {getAllMedia(selectedPost).length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-neutral-950 rounded-xl border border-white/5">
                          No media files attached to this post.
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {getAllMedia(selectedPost).map((media, idx) => {
                            const url = `${MEDIA_BASE}${media.path}`;
                            const isVid = isVideo(media.path);
                            const isImg = isImage(media.path);

                            return (
                              <div
                                key={idx}
                                className="bg-neutral-950 p-3 rounded-xl border border-white/10 flex flex-col items-center group"
                              >
                                {isVid ? (
                                  <div className="w-full">
                                    <video
                                      src={url}
                                      controls
                                      className="w-full max-h-[75vh] rounded-lg bg-black mx-auto shadow-lg"
                                      playsInline
                                    />
                                  </div>
                                ) : isImg ? (
                                  <div className="w-full flex justify-center">
                                    <img
                                      src={url}
                                      alt={media.name || `Image ${idx + 1}`}
                                      className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full py-8 px-4 flex flex-col items-center justify-center gap-3 text-center">
                                    <FileText
                                      size={48}
                                      className="text-purple-400"
                                    />
                                    <div>
                                      <p className="font-semibold text-white text-sm break-all">
                                        {media.name || media.path.split("/").pop()}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Archive / Document File
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* File Bar / Download Link */}
                                <div className="w-full flex justify-between items-center mt-3 pt-3 border-t border-white/5 px-2">
                                  <span className="text-xs text-gray-400 font-mono truncate max-w-[70%]">
                                    {media.name ||
                                      media.path.split("/").pop() ||
                                      `Attachment #${idx + 1}`}
                                  </span>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                                  >
                                    <Download size={14} /> Open / Download
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-white/10 bg-neutral-950/80 flex justify-between items-center">
                    <a
                      href={`https://pawchive.st/${service}/user/${id}/post/${selectedPost.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 underline font-medium"
                    >
                      <ExternalLink size={14} /> Open directly on Pawchive.st
                    </a>
                    <button
                      onClick={() => setSelectedPost(null)}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      Close Viewer
                    </button>
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
