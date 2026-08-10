import React, { useEffect, useState } from "react";
import { getRule34Tags } from "../services/rule34Service";
import { Menu, Search } from "lucide-react";
import { useRule34Posts } from "../hooks/useRule34Posts";
import PostCard from "../components/Rule34/PostCard";
import MediaViewer from "../components/Rule34/MediaViewer";
import SearchBar from "../components/Rule34/SearchBar";
import TagList from "../components/Rule34/TagList";
import CategoryChips from "../components/Rule34/CategoryChips";
import { useRule34Video } from "../hooks/useRule34Video";
import Rule34VideoCard from "../components/Rule34/Rule34VideoCard";
import Rule34VideoViewer from "../components/Rule34/Rule34VideoViewer";
import { Video, Image as ImageIcon } from "lucide-react";

export default function Rule34Page({ onOpenSidebar }) {
  const [mode, setMode] = useState("images"); // 'images' | 'videos'
  
  // Images State
  const { posts, loading, hasMore, loadMore, searchPosts, currentTag } = useRule34Posts();
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
    currentSearch: videoSearch 
  } = useRule34Video();
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Initial load tags & posts
  useEffect(() => {
    loadTags();
    searchPosts("");
    searchVideos("");
  }, [searchPosts, searchVideos]);

  const loadTags = async () => {
    try {
      const t = await getRule34Tags(15);
      setTagsList(t);
    } catch (e) {
      console.error("Failed to load tags", e);
    }
  };

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
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

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 md:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white mb-2 sm:mb-3">
          Rule34
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base font-light mb-6 md:mb-8 max-w-2xl">
          Discover a vast collection of community-curated artwork and
          animations.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setMode("images")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "images" 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ImageIcon size={18} /> Images (Booru)
            </button>
            <button
              onClick={() => setMode("videos")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === "videos" 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Video size={18} /> Videos (Tube)
            </button>
          </div>
        </div>

        <SearchBar 
          onSearch={mode === "images" ? searchPosts : searchVideos} 
          initialValue={mode === "images" ? currentTag : videoSearch} 
        />

        {mode === "images" && (
          <>
            <CategoryChips onTagClick={searchPosts} />
            <TagList tags={tagsList} onTagClick={searchPosts} />
          </>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {mode === "images" ? (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onClick={setSelectedPost} />
          ))
        ) : (
          videos.map((video) => (
            <Rule34VideoCard key={video.id} video={video} onClick={setSelectedVideo} />
          ))
        )}
      </div>

      {/* Loading / Empty States */}
      {(mode === "images" ? loading : videoLoading) && (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-violet-500 animate-ping"></div>
            </div>
          </div>
        </div>
      )}

      {!(mode === "images" ? loading : videoLoading) && (mode === "images" ? posts.length === 0 : videos.length === 0) && (
        <div className="text-center py-32 text-gray-500 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm mx-auto max-w-2xl">
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="text-gray-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No results found
          </h3>
          <p>Try adjusting your search terms or filters.</p>
        </div>
      )}

      {!(mode === "images" ? loading : videoLoading) && mode === "images" && posts.length > 0 && hasMore && (
        <div className="text-center py-12">
          <button
            onClick={loadMore}
            className="group relative px-8 py-3 rounded-full bg-white/5 hover:bg-violet-600/20 border border-white/10 hover:border-violet-500/50 transition-all overflow-hidden"
          >
            <span className="relative z-10 text-violet-300 group-hover:text-white font-semibold flex items-center gap-2">
              Load More Content{" "}
              <span className="group-hover:translate-y-1 transition-transform">
                ↓
              </span>
            </span>
            <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity"></div>
          </button>
        </div>
      )}

      {!(mode === "images" ? loading : videoLoading) && mode === "videos" && videos.length > 0 && (
        <div className="flex justify-center items-center gap-2 py-12">
          <button
            onClick={() => videoGoToPage(Math.max(1, videoPage - 1))}
            disabled={videoPage === 1}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Prev
          </button>
          
          <div className="flex gap-1">
            {videoPage > 2 && (
               <button onClick={() => videoGoToPage(1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-violet-600/30 transition-colors">1</button>
            )}
            {videoPage > 3 && <span className="w-10 h-10 flex items-center justify-center text-white/50">...</span>}
            
            {videoPage > 1 && (
               <button onClick={() => videoGoToPage(videoPage - 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-violet-600/30 transition-colors">{videoPage - 1}</button>
            )}
            
            <button className="w-10 h-10 rounded-lg bg-violet-600 border border-violet-500 text-white font-bold">{videoPage}</button>
            
            {videoHasMore && (
               <button onClick={() => videoGoToPage(videoPage + 1)} className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-violet-600/30 transition-colors">{videoPage + 1}</button>
            )}
            
            {videoHasMore && (
               <span className="w-10 h-10 flex items-center justify-center text-white/50">...</span>
            )}
          </div>

          <button
            onClick={() => videoGoToPage(videoPage + 1)}
            disabled={!videoHasMore}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
