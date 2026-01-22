import { useState, useCallback } from "react";
import { getRule34Posts } from "../services/rule34Service";

export const useRule34Posts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentTag, setCurrentTag] = useState("");

  const loadPosts = useCallback(async (pageNum, tags) => {
    setLoading(true);
    try {
      const newPosts = await getRule34Posts(pageNum, tags);
      if (!newPosts || newPosts.length === 0) {
        setHasMore(false);
        if (pageNum === 0) setPosts([]);
      } else {
        setPosts((prev) => (pageNum === 0 ? newPosts : [...prev, ...newPosts]));
      }
    } catch (error) {
      console.error("Failed to load posts", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPosts = useCallback(
    (tag) => {
      setCurrentTag(tag);
      setPage(0);
      setHasMore(true);
      loadPosts(0, tag);
    },
    [loadPosts],
  );

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadPosts(nextPage, currentTag);
  }, [page, currentTag, loadPosts, hasMore, loading]);

  // Initial load helper if needed, or consumer can use useEffect to call searchPosts('')

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    searchPosts,
    currentTag,
    setPosts, // Expose setPosts if manual manipulation is needed, though usually not recommended
  };
};
