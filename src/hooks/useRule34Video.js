import { useState, useCallback } from "react";

const API_BASE = "http://localhost:3001/api/rule34video";

export const useRule34Video = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState("");

  const searchVideos = useCallback(async (query = "") => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      setCurrentSearch(query);

      const res = await fetch(`${API_BASE}/list?page=1&search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      
      const data = await res.json();
      setVideos(data.videos || []);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      
      const res = await fetch(`${API_BASE}/list?page=${nextPage}&search=${encodeURIComponent(currentSearch)}`);
      if (!res.ok) throw new Error("Failed to fetch more videos");
      
      const data = await res.json();
      
      setVideos(prev => [...prev, ...(data.videos || [])]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, currentSearch, hasMore, loading]);

  const getVideoDetail = useCallback(async (slug) => {
    try {
      const res = await fetch(`${API_BASE}/detail?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Failed to fetch video detail");
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  return {
    videos,
    loading,
    error,
    hasMore,
    searchVideos,
    loadMore,
    getVideoDetail,
    currentSearch
  };
};
