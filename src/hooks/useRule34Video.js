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

  const goToPage = useCallback(async (newPage) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      const res = await fetch(`${API_BASE}/list?page=${newPage}&search=${encodeURIComponent(currentSearch)}`);
      if (!res.ok) throw new Error("Failed to fetch videos");
      
      const data = await res.json();
      
      setVideos(data.videos || []);
      setHasMore(data.hasMore);
      setPage(newPage);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, loading]);

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
    goToPage,
    getVideoDetail,
    currentSearch,
    page
  };
};
