import React, { useEffect, useState } from "react";
import { getRule34Tags } from "../services/rule34Service";
import { Menu, Search } from "lucide-react";
import { useRule34Posts } from "../hooks/useRule34Posts";
import PostCard from "../components/Rule34/PostCard";
import MediaViewer from "../components/Rule34/MediaViewer";
import SearchBar from "../components/Rule34/SearchBar";
import TagList from "../components/Rule34/TagList";
import CategoryChips from "../components/Rule34/CategoryChips";

export default function Rule34Page({ onOpenSidebar }) {
  const { posts, loading, hasMore, loadMore, searchPosts, currentTag } =
    useRule34Posts();
  const [tagsList, setTagsList] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  // Initial load tags
  useEffect(() => {
    loadTags();
    // Initial posts load is handled if we want to default to nothing or empty string
    searchPosts("");
  }, [searchPosts]);

  const loadTags = async () => {
    try {
      const t = await getRule34Tags(15);
      setTagsList(t);
    } catch (e) {
      console.error("Failed to load tags", e);
    }
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
        <MediaViewer
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onTagClick={searchPosts}
        />
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

        <SearchBar onSearch={searchPosts} initialValue={currentTag} />

        <CategoryChips onTagClick={searchPosts} />

        <TagList tags={tagsList} onTagClick={searchPosts} />
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onClick={setSelectedPost} />
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
