import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  FolderArchive,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
  Menu,
} from "lucide-react";
import { getBalbumsAlbums } from "../services/balbumsService";
import { usePersistentState } from "../hooks/usePersistentState";

const SORTS = [
  { key: "latest", label: "Terbaru" },
  { key: "files", label: "Paling Banyak Berkas" },
  { key: "oldest", label: "Terlama" },
];

const MODES = [
  { key: "broad", label: "Broad" },
  { key: "strict", label: "Strict" },
  { key: "fuzzy", label: "Fuzzy" },
];

export default function BalbumsPage({ onOpenSidebar }) {
  const navigate = useNavigate();

  const [search, setSearch] = usePersistentState("balbums_search", "");
  const [searchInput, setSearchInput] = useState(search);
  const [sort, setSort] = usePersistentState("balbums_sort", "latest");
  const [mode, setMode] = useState("broad");
  const [page, setPage] = useState(1);

  const [albums, setAlbums] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlbums = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBalbumsAlbums({
        search,
        sort,
        mode,
        page,
        per: 20,
      });
      setAlbums(res.albums || []);
      setTotalPages(res.totalPages || 1);
      setHasMore(res.hasMore || false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal memuat album Bunkr.");
    } finally {
      setLoading(false);
    }
  }, [search, sort, mode, page]);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-8 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* Top Header / Hero Banner */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                {onOpenSidebar && (
                  <button
                    onClick={onOpenSidebar}
                    className="p-2 -ml-2 rounded-xl glass-card hover:border-amber-500/40 text-gray-300 hover:text-white md:hidden"
                    aria-label="Buka Menu"
                  >
                    <Menu size={20} />
                  </button>
                )}
                <span className="text-[11px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                  <FolderArchive size={13} /> Bunkr Albums Archive
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
                BAlbums.st
                <span className="text-xs sm:text-sm font-medium text-amber-400 font-sans px-2.5 py-0.5 rounded-full glass-card border border-amber-500/20">
                  Live
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                Jelajahi dan tonton ribuan arsip album video dan foto Bunkr dengan antarmuka cepat, bebas iklan, dan responsif.
              </p>
            </div>

            {/* External link to source */}
            <a
              href="https://balbums.st/"
              target="_blank"
              rel="noopener noreferrer"
              className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card border border-white/10 hover:border-amber-500/40 text-gray-300 hover:text-amber-300 text-xs font-semibold transition-all shadow-md group"
            >
              <span>Sumber: balbums.st</span>
              <ExternalLink size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Cari album Bunkr (contoh: cosplay, leak, nama model)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 bg-black/40 border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </form>

            <button
              onClick={handleSearchSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search size={14} />
              <span>Cari</span>
            </button>
          </div>

          {/* Sort & Mode Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs">
            {/* Sort Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-400 flex items-center gap-1 text-[11px] mr-1">
                <ArrowUpDown size={12} /> Urutkan:
              </span>
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    setSort(s.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sort === s.key
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-gray-400 hover:text-white glass-card border border-white/5 hover:border-white/10"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Mode Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px] mr-1 hidden sm:inline">
                Mode Pencarian:
              </span>
              {MODES.map((m) => (
                <button
                  key={m.key}
                  onClick={() => {
                    setMode(m.key);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    mode === m.key
                      ? "bg-white/15 text-white font-bold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="min-h-[45vh] flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-xs text-amber-300 uppercase tracking-widest font-semibold">
              Memuat Album Bunkr...
            </p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 text-center rounded-3xl border border-red-500/30 max-w-md mx-auto space-y-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchAlbums}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-xs font-semibold transition-all shadow-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : albums.length === 0 ? (
          <div className="glass-card p-12 text-center rounded-3xl text-gray-400 text-sm max-w-md mx-auto space-y-3">
            <FolderArchive size={40} className="mx-auto text-gray-600" />
            <p>Tidak ada album yang ditemukan untuk kata kunci ini.</p>
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {albums.map((album) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/balbums/album/${encodeURIComponent(album.id)}`)}
                className="glass-card border border-white/10 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-amber-950/20"
              >
                {/* Thumbnail Preview Area */}
                <div className="aspect-[4/3] bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                  {album.thumbnail ? (
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement.querySelector(".fallback-icon")?.classList.remove("hidden");
                      }}
                    />
                  ) : null}

                  {/* Fallback Bunkr Icon */}
                  <div
                    className={`fallback-icon absolute inset-0 flex flex-col items-center justify-center text-gray-600 bg-gradient-to-br from-neutral-900 to-black p-4 text-center ${
                      album.thumbnail ? "hidden" : ""
                    }`}
                  >
                    <FolderArchive size={36} className="text-amber-500/40 mb-2" />
                    <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                      Bunkr Album
                    </span>
                  </div>

                  {/* Files Count Badge */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/75 text-amber-300 border border-amber-500/30 text-[10.5px] font-bold backdrop-blur-md flex items-center gap-1 shadow-md">
                      <Layers size={11} /> {album.files_count} Berkas
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                      {album.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-mono text-[10px] text-gray-500 truncate max-w-[120px]">
                      ID: {album.id}
                    </span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Buka Album <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && albums.length > 0 && (
          <div className="flex items-center justify-center gap-3 pt-8 pb-4">
            <button
              disabled={page <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2.5 glass-card hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <ChevronLeft size={16} /> Sebelumnya
            </button>
            <span className="text-xs font-bold text-amber-300 px-4 py-2 glass-card rounded-full border border-amber-500/30">
              Halaman {page} {totalPages > 1 ? `dari ${totalPages.toLocaleString()}` : ""}
            </span>
            <button
              disabled={!hasMore}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2.5 glass-card hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none border border-white/10 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              Selanjutnya <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
