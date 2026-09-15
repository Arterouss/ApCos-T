import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, Film, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { usePersistentState, useScrollRestoration } from "../hooks/usePersistentState";

export default function HentaiPlayPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = usePersistentState("hentaiplay_page", 1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = usePersistentState("hentaiplay_search", "");
  const [searchInput, setSearchInput] = useState(search);

  useScrollRestoration("hentaiplay");

  const fetchVideos = useCallback(async (pageNum, searchQuery) => {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const data = await getHentaiPlayList(pageNum, searchQuery);
      setVideos(data.videos || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError("Gagal memuat video. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(page, search);
  }, [page, search, fetchVideos]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Film size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">HentaiPlay</h1>
            <p className="text-xs text-gray-500">Anime Hentai Sub English – Updated Daily</p>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-5 flex gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul anime..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 focus:bg-white/8 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition-all duration-200 active:scale-95"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="text-rose-400 animate-spin" />
          <p className="text-gray-500 text-sm">Memuat video...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => fetchVideos(page, search)}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm hover:bg-rose-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {videos.length === 0 ? (
            <div className="text-center py-32 text-gray-500">Tidak ada video ditemukan.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {videos.map((video, i) => (
                <motion.div
                  key={video.id || i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <Link
                    to={`/hentaiplay/video/${encodeURIComponent(video.slug)}`}
                    className="group block rounded-xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-rose-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-rose-900/20"
                  >
                    <div className="relative aspect-video overflow-hidden bg-neutral-800">
                      {video.cover_url ? (
                        <img
                          src={video.cover_url}
                          alt={video.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={28} className="text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center gap-1 bg-rose-600/90 px-2 py-0.5 rounded-full text-xs text-white font-medium">
                          <Film size={10} />
                          Watch
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-gray-200 line-clamp-2 leading-tight group-hover:text-rose-300 transition-colors duration-200">
                        {video.title}
                      </p>
                      {video.categories?.length > 0 && (
                        <p className="text-[10px] text-gray-600 mt-1 line-clamp-1">
                          {video.categories.slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm text-white transition-all"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span className="text-sm text-gray-400 font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm text-white transition-all"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
