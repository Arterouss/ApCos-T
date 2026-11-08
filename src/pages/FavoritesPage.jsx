import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Trash2,
  Film,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Search,
  X,
  ExternalLink,
  Book,
  Camera,
  Users,
  Tv,
  Download,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { useFavorites } from "../hooks/useFavorites";
import {
  getDownloadableUrl,
  getSafeFilename,
  downloadMedia,
  exportFavoritesAsJson,
  importFavoritesFromJson,
} from "../utils/downloadHelper";

const CATEGORIES = [
  { id: "all", label: "Semua", icon: Sparkles },
  { id: "video", label: "Cinema & Video", icon: Film },
  { id: "manga", label: "Manga & Doujin", icon: Book },
  { id: "cosplay", label: "Cosplay & Foto", icon: Camera },
  { id: "creator", label: "Creator", icon: Users },
  { id: "anime", label: "Anime Series", icon: Tv },
];

export default function FavoritesPage({ onOpenSidebar }) {
  const { favorites, removeFavorite, importFavorites } = useFavorites();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (type, message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ type, message });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const handleDownloadItem = async (e, fav) => {
    e.preventDefault();
    e.stopPropagation();

    const mediaUrl = getDownloadableUrl(fav);
    if (!mediaUrl) {
      showToast("error", "URL berkas atau gambar tidak ditemukan untuk item ini.");
      return;
    }

    const id = fav.id || fav.link;
    setDownloadingId(id);
    const filename = getSafeFilename(fav.title, mediaUrl, fav.type);

    showToast("info", `Memulai download ${fav.title?.slice(0, 25) || "media"}...`);

    try {
      await downloadMedia(mediaUrl, filename, {
        referer: fav.referer || (fav.link?.startsWith("http") ? fav.link : ""),
      });
      showToast("success", `Berhasil mengunduh "${fav.title?.slice(0, 25) || filename}"!`);
    } catch (err) {
      console.error("Gagal download media:", err);
      showToast("error", `Gagal mengunduh: ${err.message || "Kesalahan jaringan"}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleExportBackup = () => {
    try {
      exportFavoritesAsJson(favorites);
      showToast("success", `Berhasil mengekspor ${favorites.length} item favorit.`);
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedItems = await importFavoritesFromJson(file);
      const added = importFavorites(parsedItems);
      showToast(
        "success",
        `Berhasil memuat ${parsedItems.length} item (${added} baru ditambahkan)!`
      );
    } catch (err) {
      showToast("error", err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredFavorites = useMemo(() => {
    return favorites.filter((fav) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (fav.title || "").toLowerCase().includes(q);
        const matchType = (fav.type || "").toLowerCase().includes(q);
        const matchSource = (fav.source || "").toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchSource) return false;
      }

      // Filter by category
      if (activeCategory === "all") return true;

      const type = (fav.type || "").toLowerCase();
      const source = (fav.source || "").toLowerCase();

      if (activeCategory === "video") {
        return (
          type.includes("video") ||
          type.includes("jav") ||
          type.includes("hentai") ||
          type.includes("3d") ||
          source.includes("cavporn") ||
          source.includes("hentaiplay") ||
          source.includes("porn3dx") ||
          source.includes("jav.guru")
        );
      }

      if (activeCategory === "manga") {
        return (
          type.includes("manga") ||
          type.includes("doujin") ||
          type.includes("komik") ||
          source.includes("nhentai") ||
          source.includes("doujin")
        );
      }

      if (activeCategory === "cosplay") {
        return (
          type.includes("cosplay") ||
          type.includes("album") ||
          type.includes("foto") ||
          type.includes("r34 image") ||
          source.includes("cosplay") ||
          source.includes("balbums") ||
          source.includes("bunkr") ||
          source.includes("realbooru") ||
          source.includes("rule34")
        );
      }

      if (activeCategory === "creator") {
        return (
          type.includes("creator") ||
          source.includes("coomer") ||
          source.includes("pawchive") ||
          source.includes("kemono")
        );
      }

      if (activeCategory === "anime") {
        return type.includes("anime") || source.includes("anime");
      }

      return true;
    });
  }, [favorites, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen text-white pt-6 md:pt-10 px-4 sm:px-6 md:px-8 pb-24 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-600/[0.05] blur-[170px]" />
      </div>

      {/* ── Toast Notification ────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-medium backdrop-blur-xl border ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/30 shadow-emerald-900/30"
                : toast.type === "error"
                ? "bg-rose-950/90 text-rose-200 border-rose-500/30 shadow-rose-900/30"
                : "bg-neutral-900/90 text-cyan-200 border-cyan-500/30 shadow-cyan-900/30"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            ) : (
              <Loader2 size={16} className="animate-spin text-cyan-400 shrink-0" />
            )}
            <span className="max-w-xs sm:max-w-md truncate">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="ml-1 text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/[0.06] pb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
              style={{
                background: "rgba(225, 29, 72, 0.1)",
                border: "1px solid rgba(225, 29, 72, 0.2)",
                color: "#fb7185",
              }}
            >
              <Heart size={12} className="fill-[#fb7185]" />
              Koleksi Pribadi
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-pink-500 to-red-500">
                Favorit Saya
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed mt-1.5">
              Koleksi video, anime, cosplay, manga, dan creator favorit Anda yang disimpan di seluruh menu aplikasi.
            </p>
          </div>

          {/* Action Header: Total & Backup Export/Import */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />

            <div
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold text-gray-300"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              Total: <span className="text-neon-red font-bold">{favorites.length}</span> item
            </div>

            <button
              type="button"
              onClick={handleImportClick}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
              title="Impor Cadangan Favorit (JSON)"
            >
              <Upload size={13} className="text-amber-400" />
              <span className="hidden sm:inline">Impor</span>
            </button>

            {favorites.length > 0 && (
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer"
                title="Unduh Cadangan Seluruh Favorit (.json)"
              >
                <FileDown size={13} className="text-cyan-400" />
                <span className="hidden sm:inline">Ekspor JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls (Search & Category Chips) */}
        {favorites.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500"
                          : "glass-card text-gray-300 hover:text-white border border-white/5 hover:border-white/20"
                      }`}
                    >
                      <Icon size={13} className={isActive ? "text-white" : "text-gray-400"} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px] sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari favorit..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50 transition-all"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Grid or Empty States */}
        {favorites.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-28 rounded-3xl max-w-md mx-auto text-center p-8"
            style={{
              background: "rgba(14, 16, 26, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: "rgba(255, 45, 85, 0.1)",
                border: "1px solid rgba(255, 45, 85, 0.25)",
              }}
            >
              <Heart size={32} className="text-neon-red opacity-60" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Belum Ada Favorit</h2>
            <p className="text-gray-400 text-xs mb-6">
              Tekan ikon hati di halaman konten, video, cosplay, atau anime mana saja untuk menyimpannya ke koleksi Anda.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #ff2d55, #ff6b35)",
                  boxShadow: "0 4px 20px rgba(255, 45, 85, 0.4)",
                }}
              >
                <span>Jelajahi Beranda</span>
                <ArrowRight size={14} />
              </Link>

              <button
                type="button"
                onClick={handleImportClick}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-all cursor-pointer flex items-center gap-2"
                title="Impor dari cadangan JSON"
              >
                <Upload size={14} className="text-amber-400" />
                <span>Pulihkan Cadangan</span>
              </button>
            </div>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl border border-white/5 max-w-md mx-auto p-6">
            <Search size={32} className="text-gray-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Tidak Ditemukan</p>
            <p className="text-xs text-gray-400">Tidak ada favorit yang cocok dengan kata kunci atau filter ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            <AnimatePresence>
              {filteredFavorites.map((fav, i) => {
                const isExternal = fav.link && fav.link.startsWith("http");
                const CardWrapper = isExternal ? "a" : Link;
                const linkProps = isExternal
                  ? { href: fav.link, target: "_blank", rel: "noopener noreferrer" }
                  : { to: fav.link || "#" };
                const isDownloading = downloadingId === (fav.id || fav.link);

                return (
                  <motion.div
                    key={fav.id || fav.link || i}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card relative group rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10 flex flex-col"
                  >
                    {/* Media Cover */}
                    <CardWrapper
                      {...linkProps}
                      className="block aspect-[3/4] relative overflow-hidden bg-neutral-900"
                    >
                      {fav.cover_url ? (
                        <img
                          src={fav.cover_url}
                          alt={fav.title}
                          className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}

                      {/* Fallback Icon */}
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 -z-0">
                        {fav.type?.toLowerCase().includes("manga") || fav.type?.toLowerCase().includes("doujin") ? (
                          <Book size={28} className="text-gray-700" />
                        ) : fav.type?.toLowerCase().includes("creator") ? (
                          <Users size={28} className="text-gray-700" />
                        ) : (
                          <Film size={28} className="text-gray-700" />
                        )}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-[#07070c] via-black/30 to-transparent opacity-85 group-hover:opacity-60 transition-opacity" />
                    </CardWrapper>

                    {/* Action Buttons: Download & Delete */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                      <button
                        type="button"
                        onClick={(e) => handleDownloadItem(e, fav)}
                        disabled={isDownloading}
                        className="p-2 rounded-xl text-gray-200 hover:text-cyan-300 active:scale-95 transition-all shadow-xl cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
                        style={{
                          background: "rgba(0, 0, 0, 0.75)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                        title="Unduh Berkas Media / Sampul"
                      >
                        {isDownloading ? (
                          <Loader2 size={14} className="animate-spin text-cyan-400" />
                        ) : (
                          <Download size={14} className="text-cyan-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFavorite(fav.id || fav.link);
                        }}
                        className="p-2 rounded-xl text-gray-200 hover:text-rose-400 active:scale-95 transition-all shadow-xl cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                        style={{
                          background: "rgba(0, 0, 0, 0.75)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                        }}
                        title="Hapus dari Favorit"
                      >
                        <Trash2 size={14} className="text-neon-red" />
                      </button>
                    </div>

                    {/* Info Label / Type */}
                    <div
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-bold text-gray-200 uppercase tracking-wider pointer-events-none"
                      style={{
                        background: "rgba(0, 0, 0, 0.65)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {fav.type || "Favorit"}
                    </div>

                    {/* Detail Judul */}
                    <CardWrapper
                      {...linkProps}
                      className="absolute bottom-0 inset-x-0 p-3.5 pt-6 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end"
                    >
                      <p className="text-xs font-semibold text-gray-200 line-clamp-2 leading-snug group-hover:text-neon-red transition-colors">
                        {fav.title || "Tanpa Judul"}
                      </p>
                      {fav.source && (
                        <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase tracking-wider flex items-center justify-between">
                          <span>{fav.source}</span>
                          {isExternal && <ExternalLink size={10} className="text-gray-500" />}
                        </p>
                      )}
                    </CardWrapper>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
