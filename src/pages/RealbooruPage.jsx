import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search, X, Tag, Image as ImageIcon, Video, ChevronLeft, ChevronRight,
  Download, ExternalLink, Loader2, Flame, Sparkles, Hash, ZoomIn, Heart,
  Play, Filter, RefreshCw, ShieldAlert
} from "lucide-react";
import { getRealbooruPosts, getRealbooruPost, getRealbooruMediaProxyUrl } from "../services/realbooruService";
import { usePortalMode } from "../context/PortalContext";
import { filterBlockedItems, filterBlockedTags, isBlockedText } from "../utils/contentFilter";

// ── Hot tags to display as quick chips ────────────────────────────────────
const HOT_TAGS = [
  { label: "🔥 Trending", tags: "" },
  { label: "Yuri / Lesbian 👩‍❤️‍💋‍👩", tags: "lesbian" },
  { label: "Asian", tags: "asian" },
  { label: "Blonde", tags: "blonde" },
  { label: "Teen", tags: "teen" },
  { label: "Big Boobs", tags: "big_breasts" },
  { label: "Milf", tags: "milf" },
  { label: "Brunette", tags: "brunette" },
  { label: "Redhead", tags: "redhead" },
  { label: "Latina", tags: "latina" },
  { label: "Solo", tags: "solo" },
  { label: "Cosplay", tags: "cosplay" },
  { label: "Lingerie", tags: "lingerie" },
  { label: "Outdoor", tags: "outdoor" },
  { label: "Video 🎬", tags: "video" },
];

// ── Post Card Component ───────────────────────────────────────────────────
function RealbooruCard({ post, onClick }) {
  const [imgError, setImgError] = useState(false);
  const proxyThumb = getRealbooruMediaProxyUrl(post.thumbnail);

  return (
    <div
      onClick={() => onClick(post)}
      className="group relative rounded-xl overflow-hidden cursor-pointer bg-neutral-900 border border-white/5 hover:border-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/10 aspect-square"
    >
      {!imgError ? (
        <img
          src={proxyThumb}
          alt={post.tags_str?.substring(0, 50)}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
          <ImageIcon size={32} className="text-neutral-600" />
        </div>
      )}

      {/* Video badge */}
      {post.isVideo && (
        <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
          <Play size={9} fill="white" />
          VIDEO
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <p className="text-white text-[10px] line-clamp-2 leading-tight">
            {post.tags?.slice(0, 4).join(", ")}
          </p>
        </div>
      </div>

      {/* Post ID */}
      <div className="absolute top-2 right-2 bg-black/60 text-white/60 text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
        #{post.id}
      </div>
    </div>
  );
}

// ── Media Viewer Portal ───────────────────────────────────────────────────
function MediaViewer({ post, detail, loading, onClose, onTagClick, onPrev, onNext, hasPrev, hasNext }) {
  const { setIsReaderOpen } = usePortalMode();

  useEffect(() => {
    setIsReaderOpen(true);
    document.body.classList.add("reader-active");

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      setIsReaderOpen(false);
      document.body.classList.remove("reader-active");
      window.removeEventListener("keydown", onKey);
    };
  }, [setIsReaderOpen, onClose, onPrev, onNext, hasPrev, hasNext]);

  const fileUrl = detail?.fileUrl;
  const proxyUrl = fileUrl ? getRealbooruMediaProxyUrl(fileUrl) : null;
  const isVideo = detail?.isVideo;
  const tags = detail?.tags || post.tags || [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-2xl flex flex-col" onClick={onClose}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1.5 flex-shrink-0">
            <Hash size={10} />
            {post.id}
          </span>
          {isVideo && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1.5 flex-shrink-0">
              <Video size={10} />
              VIDEO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {detail?.fileUrl && (
            <a
              href={detail.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white border border-white/10 transition-all"
              title="Buka di sumber"
            >
              <ExternalLink size={15} />
            </a>
          )}
          {detail?.fileUrl && (
            <a
              href={proxyUrl}
              download
              className="p-2 rounded-lg bg-white/5 hover:bg-emerald-600/60 text-gray-400 hover:text-white border border-white/10 transition-all"
              title="Unduh"
            >
              <Download size={15} />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-red-600/60 text-gray-400 hover:text-white border border-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Media Center */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 p-2" onClick={onClose}>

        {/* Prev / Next */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-3 z-20 p-3 rounded-full bg-black/70 hover:bg-red-600/80 text-white border border-white/15 transition-all shadow-xl"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-3 z-20 p-3 rounded-full bg-black/70 hover:bg-red-600/80 text-white border border-white/15 transition-all shadow-xl"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Media */}
        <div className="max-h-full max-w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={40} className="animate-spin text-red-400" />
              <p className="text-gray-400 text-sm">Memuat media...</p>
            </div>
          ) : detail?.isBlocked ? (
            <div className="flex flex-col items-center gap-3 text-center p-8 max-w-md bg-neutral-900/90 border border-red-500/30 rounded-2xl">
              <ShieldAlert size={44} className="text-red-400" />
              <h3 className="text-white font-semibold text-base">Konten Diblokir</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                Postingan ini diblokir sesuai filter konten (BL / Yaoi / Gay). Konten Yuri dan Lesbian tetap dapat diakses.
              </p>
            </div>
          ) : isVideo && proxyUrl ? (
            <video
              src={proxyUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl border border-white/10"
            />
          ) : proxyUrl ? (
            <img
              src={proxyUrl}
              alt={`Post #${post.id}`}
              className="max-h-[75vh] max-w-full rounded-xl shadow-2xl border border-white/10 object-contain"
            />
          ) : (
            <div className="flex items-center justify-center gap-3 text-gray-500">
              <ImageIcon size={32} />
              <span>Media tidak ditemukan</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags Bottom Panel */}
      {tags.length > 0 && (
        <div
          className="flex-shrink-0 px-4 py-3 bg-black/80 border-t border-white/10 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
            {filterBlockedTags(tags).map((tag) => (
              <button
                key={tag}
                onClick={() => { onClose(); onTagClick(tag); }}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-red-500/30 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function RealbooruPage({ onOpenSidebar }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentTag, setCurrentTag] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeHotTag, setActiveHotTag] = useState(0);

  // Viewer state
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [viewerDetail, setViewerDetail] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Fetch posts by page
  const fetchPosts = useCallback(async (tags = "", pg = 1) => {
    try {
      if (tags && isBlockedText(tags)) {
        setError("Pencarian untuk kata kunci ini diblokir (Yaoi / Gay / BL). Konten Yuri & Lesbian tetap diizinkan.");
        setPosts([]);
        setHasMore(false);
        setTotalPages(1);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const data = await getRealbooruPosts({ tags, page: pg });
      if (data?.blocked) {
        setError(data.message || "Konten ini diblokir (Yaoi / Gay / BL).");
        setPosts([]);
        setHasMore(false);
        setTotalPages(1);
        return;
      }

      const rawPosts = data?.posts || [];
      const newPosts = filterBlockedItems(rawPosts);

      setPosts(newPosts);
      setPage(pg);
      setTotalPages(data?.totalPages || (newPosts.length >= 40 ? pg + 5 : pg));
      setHasMore(data?.hasMore ?? (pg < (data?.totalPages || 1)));

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError("Gagal memuat postingan. Coba lagi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts("", 1);
  }, [fetchPosts]);

  const goToPage = useCallback((newPage) => {
    if (newPage < 1 || (totalPages && newPage > totalPages) || newPage === page) return;
    fetchPosts(currentTag, newPage);
  }, [currentTag, page, totalPages, fetchPosts]);

  // Search handler
  const handleSearch = useCallback((tags) => {
    if (tags && isBlockedText(tags)) {
      setError("Pencarian untuk kata kunci ini diblokir (Yaoi / Gay / BL). Konten Yuri & Lesbian tetap diizinkan.");
      setPosts([]);
      setHasMore(false);
      setTotalPages(1);
      setCurrentTag(tags);
      setActiveHotTag(-1);
      return;
    }
    setCurrentTag(tags);
    setActiveHotTag(-1);
    fetchPosts(tags, 1);
  }, [fetchPosts]);

  const handleHotTag = useCallback((idx, tags) => {
    setActiveHotTag(idx);
    setCurrentTag(tags);
    setSearchInput(tags);
    fetchPosts(tags, 1);
  }, [fetchPosts]);

  // Viewer
  const openViewer = useCallback(async (idx) => {
    setSelectedIndex(idx);
    setViewerDetail(null);
    setViewerLoading(true);

    try {
      const detail = await getRealbooruPost(posts[idx].id);
      setViewerDetail(detail);
    } catch (e) {
      console.error("Failed to fetch post detail", e);
    } finally {
      setViewerLoading(false);
    }
  }, [posts]);

  const closeViewer = useCallback(() => {
    setSelectedIndex(null);
    setViewerDetail(null);
  }, []);

  const prevPost = useCallback(() => {
    if (selectedIndex > 0) openViewer(selectedIndex - 1);
  }, [selectedIndex, openViewer]);

  const nextPost = useCallback(() => {
    if (selectedIndex < posts.length - 1) openViewer(selectedIndex + 1);
  }, [selectedIndex, posts.length, openViewer]);

  const handleTagClick = useCallback((tag) => {
    setSearchInput(tag);
    setCurrentTag(tag);
    setActiveHotTag(-1);
    fetchPosts(tag, 1, false);
  }, [fetchPosts]);

  return (
    <div className="min-h-screen text-white pt-4 md:pt-8 px-3.5 sm:px-5 md:px-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                <Flame size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                  Real<span className="text-red-400">booru</span>
                </h1>
                <p className="text-gray-500 text-xs mt-0.5">Foto & Video IRL • Cari lewat tagar</p>
              </div>
            </div>
            {currentTag && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-400">Mencari:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/25 text-xs font-semibold">
                  <Hash size={11} />
                  {currentTag}
                  <button
                    onClick={() => { setSearchInput(""); setCurrentTag(""); setActiveHotTag(0); fetchPosts("", 1, false); }}
                    className="ml-1 hover:text-white transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Stats badge */}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-medium">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Sparkles size={13} className="text-red-400" />
              <span>{posts.length} foto/video</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput); }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari berdasarkan tagar... (contoh: blonde, teen, cosplay)"
                className="w-full pl-11 pr-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); handleSearch(""); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:text-white text-gray-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Cari</span>
            </button>
            <button
              type="button"
              onClick={() => fetchPosts(currentTag, 1, false)}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </form>
        </div>

        {/* Hot Tags Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {HOT_TAGS.map((ht, idx) => (
            <button
              key={idx}
              onClick={() => handleHotTag(idx, ht.tags)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all border whitespace-nowrap ${
                activeHotTag === idx
                  ? "bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500/50 shadow-lg shadow-red-500/20"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/10 hover:border-white/20"
              }`}
            >
              {ht.label}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            <X size={18} />
            <span className="text-sm">{error}</span>
            <button
              onClick={() => fetchPosts(currentTag, 1, false)}
              className="ml-auto px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-all"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon size={48} className="mx-auto mb-4 text-gray-700" />
            <p className="text-gray-500 font-semibold">Tidak ada postingan ditemukan</p>
            <p className="text-gray-600 text-sm mt-1">Coba dengan tagar lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {posts.map((post, idx) => (
              <RealbooruCard
                key={`${post.id}-${idx}`}
                post={post}
                onClick={() => openViewer(idx)}
              />
            ))}
          </div>
        )}

        {/* ── Numbered Pagination ────────────────────────────────── */}
        {!loading && posts.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8 border-t border-white/10 mt-8">
            <div className="text-xs text-gray-400">
              Halaman <span className="font-bold text-white">{page}</span> dari{" "}
              <span className="font-bold text-white">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Prev button */}
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft size={15} />
                <span>Prev</span>
              </button>

              {/* Number buttons with ellipsis */}
              {(() => {
                const maxVisible = 5;
                let start = Math.max(1, page - Math.floor(maxVisible / 2));
                let end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1);
                }
                const pageNumbers = [];
                for (let i = start; i <= end; i++) pageNumbers.push(i);

                return (
                  <>
                    {start > 1 && (
                      <>
                        <button
                          onClick={() => goToPage(1)}
                          className="w-9 h-9 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        >
                          1
                        </button>
                        {start > 2 && <span className="text-gray-600 px-1 text-xs">...</span>}
                      </>
                    )}

                    {pageNumbers.map((p) => {
                      const isActive = p === page;
                      return (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          disabled={loading}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isActive
                              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-500/60 shadow-lg shadow-red-500/30 scale-105"
                              : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}

                    {end < totalPages && (
                      <>
                        {end < totalPages - 1 && <span className="text-gray-600 px-1 text-xs">...</span>}
                        <button
                          onClick={() => goToPage(totalPages)}
                          className="w-9 h-9 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Next button */}
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Media Viewer */}
      {selectedIndex !== null && (
        <MediaViewer
          post={posts[selectedIndex]}
          detail={viewerDetail}
          loading={viewerLoading}
          onClose={closeViewer}
          onTagClick={handleTagClick}
          onPrev={prevPost}
          onNext={nextPost}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < posts.length - 1}
        />
      )}
    </div>
  );
}
