import React, { useEffect, useState } from "react";
import { getRule34Posts, getRule34Tags } from "../services/rule34Service";
import {
  Search,
  Loader,
  Image as ImageIcon,
  Play,
  Download,
  Menu,
  X,
} from "lucide-react";

export default function Rule34Page({ onOpenSidebar }) {
  const [posts, setPosts] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  // State for modal
  const [selectedPost, setSelectedPost] = useState(null);

  // Initial load
  useEffect(() => {
    loadPosts(0, "");
    loadTags();
  }, []);

  const loadTags = async () => {
    const t = await getRule34Tags(15);
    setTagsList(t);
  };

  const loadPosts = async (pageNum, tags) => {
    setLoading(true);
    try {
      const newPosts = await getRule34Posts(pageNum, tags);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => (pageNum === 0 ? newPosts : [...prev, ...newPosts]));
      }
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(0);
    setHasMore(true);
    loadPosts(0, search);
  };

  const onTagClick = (tagName) => {
    setSearch(tagName);
    setPage(0);
    setHasMore(true);
    loadPosts(0, tagName);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, search);
  };

  const openPost = (post) => {
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen text-white pt-20 px-4 md:px-8 pb-20">
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg hover:bg-white/10 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Media Viewer Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
          <button
            onClick={closePost}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center p-1">
            {selectedPost.file_url.endsWith(".mp4") ||
            selectedPost.file_url.endsWith(".webm") ||
            selectedPost.tags.includes("video") ? (
              <video
                src={selectedPost.file_url}
                controls
                autoPlay
                loop
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-full rounded-2xl shadow-2xl bg-black border border-white/10"
              />
            ) : (
              <img
                src={selectedPost.file_url}
                referrerPolicy="no-referrer"
                alt="Content"
                className="max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            )}

            <div className="mt-6 w-full flex flex-col md:flex-row justify-between items-start gap-4 text-gray-300 bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-white/5">
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedPost.tags
                  .split(" ")
                  .slice(0, 15)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        closePost();
                        onTagClick(tag);
                      }}
                      className="text-xs bg-white/5 hover:bg-violet-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-full cursor-pointer transition-all border border-white/5"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
              <div className="flex gap-3 shrink-0">
                <a
                  href={selectedPost.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 backdrop-blur-sm transition-colors"
                >
                  <ImageIcon size={16} /> Source
                </a>
                <a
                  href={selectedPost.file_url}
                  download
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2 rounded-lg text-white font-medium text-sm backdrop-blur-sm transition-colors"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white mb-3">
          Rule34
        </h1>
        <p className="text-gray-400 text-sm md:text-base font-light mb-8 max-w-2xl">
          Discover a vast collection of community-curated artwork and
          animations.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="flex gap-3 max-w-2xl mb-8 relative z-20"
        >
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-400 transition-colors"
              size={20}
            />
            <input
              type="text"
              placeholder="Search tags (e.g. naruto video sort:score)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all text-sm shadow-lg shadow-black/20"
            />
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white px-8 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-900/20"
          >
            Search
          </button>
        </form>

        {/* Quick Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: "🔥 Popular", tag: "sort:score:desc" },
            { label: "🎬 Video", tag: "video" },
            { label: "🧊 3D", tag: "3d" },
            { label: "🎨 2D", tag: "2d" },
            { label: "👾 GIF", tag: "animated_gif" },
            { label: "🖼️ Images", tag: "-video" },
          ].map((cat) => (
            <button
              key={cat.label}
              onClick={() => onTagClick(cat.tag)}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Popular Tags */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider mr-2">
              Trending:
            </span>
            {tagsList.slice(0, 8).map((tag) => (
              <button
                key={tag.label || tag.tag}
                onClick={() => onTagClick(tag.label || tag.tag)}
                className="text-xs bg-black/20 hover:bg-violet-500/20 text-gray-400 hover:text-violet-300 px-3 py-1 rounded-full transition-colors border border-white/5"
              >
                #{tag.label || tag.tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => openPost(post)}
            className="relative aspect-[2/3] group rounded-2xl overflow-hidden bg-white/5 border border-white/5 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:border-violet-500/50 transition-all duration-500"
          >
            <img
              src={post.preview_url}
              referrerPolicy="no-referrer"
              alt={post.tags}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
              <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-hidden">
                {post.tags
                  .split(" ")
                  .slice(0, 4)
                  .map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white font-medium"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-2">
                <span className="text-xs font-bold text-violet-300">
                  ★ {post.score}
                </span>
                <span
                  className={`p-2 rounded-full text-white shadow-lg ${
                    post.tags.includes("video") ? "bg-red-500" : "bg-blue-500"
                  }`}
                >
                  {post.tags.includes("video") ? (
                    <Play size={12} fill="currentColor" />
                  ) : (
                    <ImageIcon size={12} />
                  )}
                </span>
              </div>
            </div>

            {/* Type Indicator (Always Visible) */}
            {post.tags.includes("video") && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 shadow-lg">
                <Play size={10} fill="currentColor" /> Play
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading / Empty States */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-violet-500 animate-ping"></div>
            </div>
          </div>
        </div>
      )}

      {!loading && posts.length === 0 && (
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

      {!loading && posts.length > 0 && hasMore && (
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
    </div>
  );
}
