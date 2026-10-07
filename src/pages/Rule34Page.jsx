import React, { useEffect, useState } from "react";
import { getRule34Tags } from "../services/rule34Service";
import { Video, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { useRule34Posts } from "../hooks/useRule34Posts";
import PostCard from "../components/Rule34/PostCard";
import MediaViewer from "../components/Rule34/MediaViewer";
import SearchBar from "../components/Rule34/SearchBar";
import TagList from "../components/Rule34/TagList";
import CategoryChips from "../components/Rule34/CategoryChips";
import { useRule34Video } from "../hooks/useRule34Video";
import Rule34VideoCard from "../components/Rule34/Rule34VideoCard";
import Rule34VideoViewer from "../components/Rule34/Rule34VideoViewer";
import { useModalBack } from "../hooks/useModalBack";
import { filterBlockedTags } from "../utils/contentFilter";

export default function Rule34Page({ onOpenSidebar }) {
  const [mode, setMode] = useState("images"); // 'images' | 'videos'

  // Images State
  const { posts, loading, hasMore, loadMore, searchPosts, currentTag } =
    useRule34Posts();
  const [tagsList, setTagsList] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  // Videos State
  const {
    videos,
    loading: videoLoading,
    hasMore: videoHasMore,
    page: videoPage,
    goToPage: videoGoToPage,
    searchVideos,
    currentSearch: videoSearch,
  } = useRule34Video();
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Back button HP menutup modal yang sedang aktif
  const activeModal = !!selectedPost || !!selectedVideo;
  const closeActiveModal = () => {
    if (selectedPost) setSelectedPost(null);
    if (selectedVideo) setSelectedVideo(null);
  };
  useModalBack(activeModal, closeActiveModal);

  useEffect(() => {
    let isMounted = true;
    getRule34Tags(15)
      .then((t) => {
        if (isMounted) setTagsList(filterBlockedTags(t));
      })
      .catch((e) => console.error("Failed to load tags", e));

    searchPosts("");
    searchVideos("");
    return () => {
      isMounted = false;
    };
  }, [searchPosts, searchVideos]);

  return (
    <div className="min-h-screen text-white pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8 pb-24">
      {/* Media Viewer Modals */}
      {selectedPost && (
        <MediaViewer
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onTagClick={(tag) => {
            setMode("images");
            searchPosts(tag);
          }}
        />
      )}
      {selectedVideo && (
        <Rule34VideoViewer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Hero Banner */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={12} className="text-violet-400" /> Booru & Tube Network
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                Rule<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">34</span> Vault
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-xl">
                Jelajahi karya seni ilustrasi anime, manga, dan animasi 3D terkurasi komunitas.
              </p>
            </div>

            {/* Mode Switcher Pill */}
            <div className="flex bg-black/40 rounded-full p-1 border border-white/10 self-start md:self-auto shadow-inner">
              <button
                onClick={() => setMode("images")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                  mode === "images"
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <ImageIcon size={16} /> Images (Booru)
              </button>
              <button
                onClick={() => setMode("videos")}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 ${
                  mode === "videos"
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Video size={16} /> Videos (Tube)
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar & Tag Filters */}
        <div className="space-y-4">
          <SearchBar
            onSearch={mode === "images" ? searchPosts : searchVideos}
            initialValue={mode === "images" ? currentTag : videoSearch}
          />

          {mode === "images" && (
            <div className="space-y-3">
              <CategoryChips onTagClick={searchPosts} />
              <TagList tags={tagsList} onTagClick={searchPosts} />
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {mode === "images"
            ? posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={setSelectedPost}
                />
              ))
            : videos.map((video) => (
                <Rule34VideoCard
                  key={video.id}
                  video={video}
                  onClick={setSelectedVideo}
                />
              ))}
        </div>

        {/* Loading */}
        {(mode === "images" ? loading : videoLoading) && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <p className="text-xs text-violet-300 uppercase tracking-widest font-semibold">
              Memuat Koleksi Rule34...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!(mode === "images" ? loading : videoLoading) &&
          (mode === "images" ? posts.length === 0 : videos.length === 0) && (
            <div className="text-center py-24 text-gray-500 glass-card rounded-3xl border border-white/10 max-w-md mx-auto">
              <Sparkles className="text-gray-600 mx-auto mb-3" size={36} />
              <h3 className="text-base font-bold text-white mb-1">
                Tidak Ada Hasil
              </h3>
              <p className="text-xs text-gray-400">
                Coba sesuaikan kata kunci atau pilih tag lain.
              </p>
            </div>
          )}

        {/* Load More (Images) */}
        {!(mode === "images" ? loading : videoLoading) &&
          mode === "images" &&
          posts.length > 0 &&
          hasMore && (
            <div className="text-center py-10">
              <button
                onClick={loadMore}
                className="px-8 py-3 rounded-full glass-card hover:border-violet-500/40 text-violet-300 hover:text-white font-semibold text-xs sm:text-sm tracking-wide border border-white/10 transition-all shadow-md inline-flex items-center gap-2"
              >
                Muat Lebih Banyak Gambar &darr;
              </button>
            </div>
          )}

        {/* Pagination (Videos) */}
        {!(mode === "images" ? loading : videoLoading) &&
          mode === "videos" &&
          videos.length > 0 && (
            <div className="flex justify-center items-center gap-2 py-10">
              <button
                onClick={() => videoGoToPage(Math.max(1, videoPage - 1))}
                disabled={videoPage === 1}
                className="px-4 py-2 rounded-full glass-card border border-white/10 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-500/40 transition-all shadow-md"
              >
                Sebelumnya
              </button>

              <div className="flex gap-1.5">
                {videoPage > 2 && (
                  <button
                    onClick={() => videoGoToPage(1)}
                    className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-violet-500/40 transition-colors"
                  >
                    1
                  </button>
                )}
                {videoPage > 3 && (
                  <span className="w-9 h-9 flex items-center justify-center text-white/50 text-xs">
                    ...
                  </span>
                )}
                {videoPage > 1 && (
                  <button
                    onClick={() => videoGoToPage(videoPage - 1)}
                    className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-violet-500/40 transition-colors"
                  >
                    {videoPage - 1}
                  </button>
                )}
                <button className="w-9 h-9 rounded-full bg-violet-600 border border-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30">
                  {videoPage}
                </button>
                {videoHasMore && (
                  <button
                    onClick={() => videoGoToPage(videoPage + 1)}
                    className="w-9 h-9 rounded-full glass-card border border-white/10 text-white text-xs hover:border-violet-500/40 transition-colors"
                  >
                    {videoPage + 1}
                  </button>
                )}
                {videoHasMore && (
                  <span className="w-9 h-9 flex items-center justify-center text-white/50 text-xs">
                    ...
                  </span>
                )}
              </div>

              <button
                onClick={() => videoGoToPage(videoPage + 1)}
                disabled={!videoHasMore}
                className="px-4 py-2 rounded-full glass-card border border-white/10 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:border-violet-500/40 transition-all shadow-md"
              >
                Selanjutnya
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
