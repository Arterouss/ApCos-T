import { useState, useCallback } from "react";
import { fetchNhentaiGalleries, fetchNhentaiDetail } from "../services/nhentaiService";

export const useNhentai = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState("");

  const searchGalleries = useCallback(async (query = "", sort = "") => {
    try {
      setLoading(true);
      setError(null);
      setPage(1);
      setCurrentSearch(query);
      setCurrentSort(sort);

      const data = await fetchNhentaiGalleries(1, query, sort);
      setGalleries(data.result || data.data || []);
      
      // Calculate hasMore based on num_pages
      setHasMore(data.num_pages > 1);
    } catch (err) {
      setError(err.message);
      setGalleries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback(async (newPage) => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      const data = await fetchNhentaiGalleries(newPage, currentSearch, currentSort);
      
      setGalleries(data.result || data.data || []);
      setHasMore(newPage < data.num_pages);
      setPage(newPage);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentSearch, loading]);

  const getGalleryDetail = useCallback(async (id) => {
    try {
      return await fetchNhentaiDetail(id);
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  return {
    galleries,
    loading,
    error,
    hasMore,
    searchGalleries,
    goToPage,
    getGalleryDetail,
    currentSearch,
    currentSort,
    page
  };
};
