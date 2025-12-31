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
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-20 px-4 md:px-8 pb-20">
      <button
        onClick={onOpenSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Media Viewer Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={closePost}
            className="absolute top-4 right-4 p-2 bg-gray-800/50 hover:bg-red-600 rounded-full text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            {selectedPost.file_url.endsWith(".mp4") ||
            selectedPost.file_url.endsWith(".webm") ||
            selectedPost.tags.includes("video") ? (
              <video
                src={selectedPost.file_url}
                controls
                autoPlay
                loop
                referrerPolicy="no-referrer"
                className="max-h-[80vh] w-full rounded-lg shadow-2xl bg-black"
              />
            ) : (
              <img
                src={selectedPost.file_url}
                referrerPolicy="no-referrer"
                alt="Content"
                className="max-h-[80vh] object-contain rounded-lg shadow-2xl"
              />
            )}

            <div className="mt-4 w-full flex justify-between items-center text-gray-300">
              <div className="flex flex-wrap gap-2">
                {selectedPost.tags
                  .split(" ")
                  .slice(0, 10)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-800 px-2 py-1 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
              <div className="flex gap-2">
                <a
                  href={selectedPost.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2"
                >
                  <ImageIcon size={16} /> Source
                </a>
                <a
                  href={selectedPost.file_url}
                  download
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium text-sm"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500 mb-2">
          Rule34
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Explore artwork and animations. (Filtered)
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search tags (e.g. naruto video)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-gray-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-green-500 transition-colors text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 rounded-xl font-medium transition-colors"
          >
            Search
          </button>
        </form>

        {/* Popular Tags */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-500 self-center mr-2">
              Popular:
            </span>
            {tagsList.map((tag) => (
              <button
                key={tag.label || tag.tag}
                onClick={() => onTagClick(tag.label || tag.tag)}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full transition-colors"
              >
                {tag.label || tag.tag} ({tag.count || 0})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => openPost(post)}
            className="relative aspect-[2/3] group rounded-xl overflow-hidden bg-gray-900 border border-gray-800 cursor-pointer"
          >
            <img
              src={post.preview_url}
              alt={post.tags}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <div className="flex flex-wrap gap-1 mb-2 max-h-20 overflow-hidden">
                {post.tags
                  .split(" ")
                  .slice(0, 5)
                  .map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  Score: {post.score}
                </span>
                <span className="p-2 bg-green-600 rounded-full text-white">
                  {post.tags.includes("video") ? (
                    <Play size={14} fill="currentColor" />
                  ) : (
                    <ImageIcon size={14} />
                  )}
                </span>
              </div>
            </div>

            {/* Type Indicator */}
            {post.tags.includes("video") && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white flex items-center gap-1">
                <Play size={10} fill="currentColor" /> Video
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loading / Empty States */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader className="animate-spin text-green-500" size={32} />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon className="mx-auto mb-4 opacity-50" size={48} />
          <p>No posts found. Try searching for something else.</p>
        </div>
      )}

      {!loading && posts.length > 0 && hasMore && (
        <div className="text-center py-8">
          <button
            onClick={loadMore}
            className="text-green-400 hover:text-green-300 font-medium text-sm border border-green-500/30 px-6 py-2 rounded-full hover:bg-green-500/10 transition-colors"
          >
            Load More contents
          </button>
        </div>
      )}
    </div>
  );
}
