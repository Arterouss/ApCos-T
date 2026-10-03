import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  Loader2, 
  AlertCircle, 
  FolderOpen, 
  X, 
  Play, 
  Clock, 
  HardDrive, 
  Link as LinkIcon, 
  Check, 
  Database,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  Plus,
  Layers,
  Search,
  CheckCircle2,
  FolderPlus
} from "lucide-react";

const STORAGE_KEY = "apicos_drive_folder_links";

export default function PersonalVideoPage() {
  const [folderLinks, setFolderLinks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      const legacy = localStorage.getItem("apicos_drive_folder_link");
      return legacy ? [legacy] : [];
    } catch {
      return [];
    }
  });

  const [inputLink, setInputLink] = useState("");
  const [videos, setVideos] = useState([]);
  const [folderStats, setFolderStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [showManageModal, setShowManageModal] = useState(false);
  const [activeDriveFilter, setActiveDriveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPlayingVideo(null);
        setShowManageModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Reset player loading when a video is clicked
  useEffect(() => {
    if (playingVideo) {
      setIsPlayerLoading(true);
    }
  }, [playingVideo]);

  // Load server-saved config on mount
  useEffect(() => {
    let isMounted = true;
    async function loadServerConfig() {
      try {
        const res = await axios.get("/api/personal/drive/config");
        if (isMounted && res.data?.success && Array.isArray(res.data.folderLinks) && res.data.folderLinks.length > 0) {
          const remoteLinks = res.data.folderLinks;
          setFolderLinks(remoteLinks);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteLinks));
          fetchVideos(remoteLinks);
          return;
        }
      } catch (err) {
        console.warn("Gagal mengambil konfigurasi Google Drive dari server:", err.message);
      }

      // Fallback: localStorage
      try {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFolderLinks(parsed);
            fetchVideos(parsed);
            return;
          }
        }
      } catch {}

      setShowManageModal(true);
    }

    loadServerConfig();
    return () => { isMounted = false; };
  }, []);

  const fetchVideos = async (linksToFetch) => {
    const targets = linksToFetch || folderLinks;
    if (!targets || targets.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/personal/drive", {
        params: { folderLinks: targets }
      });
      if (res.data.success) {
        setVideos(res.data.data || []);
        setFolderStats(res.data.folderStats || []);
      } else {
        throw new Error(res.data.error || "Gagal memuat video");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal mengambil video dari Google Drive");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFolder = async () => {
    const cleanLink = inputLink.trim();
    if (!cleanLink) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await axios.post("/api/personal/drive/config", {
        folderLink: cleanLink,
        action: "add"
      });

      const updatedLinks = res.data?.folderLinks || [...folderLinks, cleanLink];
      setFolderLinks(updatedLinks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks));
      setInputLink("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      fetchVideos(updatedLinks);
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || "Gagal menambahkan link folder ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFolder = async (linkToDelete) => {
    if (!window.confirm("Hapus tautan folder Google Drive ini? Video di dalam folder Drive Anda tetap aman.")) {
      return;
    }

    try {
      const res = await axios.delete(`/api/personal/drive/config?link=${encodeURIComponent(linkToDelete)}`);
      const updatedLinks = res.data?.folderLinks || folderLinks.filter(l => l !== linkToDelete);
      setFolderLinks(updatedLinks);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLinks));

      if (updatedLinks.length > 0) {
        fetchVideos(updatedLinks);
      } else {
        setVideos([]);
        setFolderStats([]);
        setShowManageModal(true);
      }
    } catch (err) {
      alert("Gagal menghapus folder: " + (err.response?.data?.error || err.message));
    }
  };

  // Filter video berdasarkan tab Drive dan kata kunci pencarian
  const filteredVideos = videos.filter(v => {
    const matchesDrive = activeDriveFilter === "all" || String(v.driveIndex) === String(activeDriveFilter);
    const matchesQuery = !searchQuery.trim() || v.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDrive && matchesQuery;
  });

  const isApiKeyNotSet = error && error.includes("API_KEY_NOT_SET");

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md"
            onClick={() => setPlayingVideo(null)}
          >
            {/* Absolute Close Button */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 z-[120] p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-red-600 text-white transition-all backdrop-blur-md shadow-lg group active:scale-95"
              title="Tutup (Esc)"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-5xl flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative z-10"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-white/10 shrink-0 pr-12 sm:pr-16 bg-neutral-900/90">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Film size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate text-sm sm:text-base">{playingVideo.title}</h3>
                    {playingVideo.driveLabel && (
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                        {playingVideo.driveLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Player Box */}
              <div className="aspect-video bg-neutral-950 relative flex items-center justify-center overflow-hidden">
                {isPlayerLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950 text-gray-400 z-0">
                    <Loader2 size={36} className="animate-spin text-indigo-500" />
                    <span className="text-xs text-gray-400 font-medium animate-pulse">Memuat player Google Drive...</span>
                  </div>
                )}
                
                <iframe
                  key={playingVideo.id}
                  src={`https://drive.google.com/file/d/${playingVideo.id}/preview`}
                  title={playingVideo.title}
                  className="w-full h-full border-0 relative z-10"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  onLoad={() => setIsPlayerLoading(false)}
                />
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 border-t border-white/5 bg-neutral-900/95 shrink-0">
                <div className="flex items-center gap-4">
                  {playingVideo.duration && (
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <Clock size={13} className="text-gray-500" /> {playingVideo.duration}
                    </span>
                  )}
                  {playingVideo.size && (
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                      <HardDrive size={13} className="text-gray-500" /> {playingVideo.size}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <a 
                    href={`https://drive.google.com/file/d/${playingVideo.id}/view`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 font-medium transition-all active:scale-95"
                  >
                    <ExternalLink size={13} />
                    <span>Buka di Google Drive</span>
                  </a>
                  {playingVideo.download_url && (
                    <a 
                      href={playingVideo.download_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-medium transition-all active:scale-95"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Drive Folders Modal */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md"
            onClick={() => setShowManageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-xl bg-neutral-900 border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <FolderPlus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Kelola Folder Google Drive</h3>
                    <p className="text-xs text-gray-400">Hubungkan beberapa akun Drive (15 GB + 15 GB gratis)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Input Tambah Folder Baru */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                  <span>Tambah Link Folder Baru:</span>
                  <span className="text-[10px] text-indigo-400">Pastikan sharing: "Anyone with link"</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={inputLink}
                    onChange={e => setInputLink(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isSaving && handleAddFolder()}
                    placeholder="https://drive.google.com/drive/folders/..."
                    disabled={isSaving}
                    className="flex-1 bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                  />
                  <button
                    onClick={handleAddFolder}
                    disabled={!inputLink.trim() || isSaving}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span>Tambah Drive</span>
                  </button>
                </div>
              </div>

              {saveError && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                  <Check size={14} className="shrink-0 text-emerald-400" />
                  <span>Folder berhasil ditambahkan dan disimpan permanen!</span>
                </div>
              )}

              {/* Daftar Folder yang Sedang Terhubung */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-gray-400 block uppercase tracking-wider">
                  Folder Terhubung ({folderLinks.length}):
                </span>
                
                {folderLinks.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2 text-center">Belum ada folder Google Drive yang terhubung.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {folderLinks.map((link, idx) => {
                      const stat = folderStats.find(s => s.driveIndex === idx + 1);
                      return (
                        <div
                          key={`folder-row-${idx}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all text-xs"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px]">
                                Drive {idx + 1}
                              </span>
                              {stat && stat.status === "ok" && (
                                <span className="text-[10px] text-emerald-400 font-medium">
                                  {stat.count} Video
                                </span>
                              )}
                              {stat && stat.status === "error" && (
                                <span className="text-[10px] text-red-400 font-medium" title={stat.error}>
                                  ⚠️ Error izin/akses
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 font-mono text-[11px] truncate mt-1">
                              {link}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteFolder(link)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                            title="Hapus folder ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                <span>💡 Total Kapasitas: {folderLinks.length * 15} GB</span>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Film size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Video Pribadi</h1>
              {folderLinks.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database size={11} /> {folderLinks.length} Drive Aktif ({folderLinks.length * 15} GB)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <span>Stream dari multi-folder Google Drive tanpa batas</span>
              {folderLinks.length > 0 && (
                <span className="sm:hidden inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database size={9} /> {folderLinks.length} Drive
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button 
            onClick={() => fetchVideos()} 
            disabled={loading || folderLinks.length === 0}
            className="px-3.5 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Muat ulang daftar video"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => setShowManageModal(true)} 
            className="px-3.5 py-2 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 font-semibold"
          >
            <FolderPlus size={13} />
            <span>{folderLinks.length > 0 ? `Kelola Drive (${folderLinks.length})` : "+ Hubungkan Drive"}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Tab Drive & Search */}
      {folderLinks.length > 0 && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-900/60 p-2.5 rounded-2xl border border-white/5">
          {/* Drive Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            <button
              onClick={() => setActiveDriveFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeDriveFilter === "all"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
              }`}
            >
              Semua ({videos.length})
            </button>
            {folderLinks.map((_, idx) => {
              const driveIdx = idx + 1;
              const count = videos.filter(v => v.driveIndex === driveIdx).length;
              return (
                <button
                  key={`filter-drive-${driveIdx}`}
                  onClick={() => setActiveDriveFilter(String(driveIdx))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeDriveFilter === String(driveIdx)
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <HardDrive size={11} />
                  <span>Drive {driveIdx}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowManageModal(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all flex items-center gap-1 whitespace-nowrap"
              title="Tambah Google Drive baru"
            >
              <Plus size={13} />
              <span>Drive Baru</span>
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari video..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400 animate-pulse">Mengambil video dari {folderLinks.length} folder Google Drive...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && !isApiKeyNotSet && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle size={40} className="text-red-400/60" />
          <p className="text-red-400 text-sm max-w-md">{error}</p>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchVideos()} 
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors border border-white/10"
            >
              Coba Lagi
            </button>
            <button 
              onClick={() => setShowManageModal(true)} 
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-sm transition-colors border border-indigo-500/30"
            >
              Kelola Folder Drive
            </button>
          </div>
        </div>
      )}

      {/* Empty State / Belum ada folder */}
      {!loading && !error && folderLinks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center bg-neutral-900/40 rounded-3xl border border-white/5 p-8 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderPlus size={32} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Belum Ada Google Drive Terhubung</h3>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md">
              Hubungkan folder Google Drive publik Anda untuk mulai menonton video. Anda bisa menghubungkan lebih dari 1 akun Drive jika kapasitas akun pertama sudah penuh.
            </p>
          </div>
          <button
            onClick={() => setShowManageModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Hubungkan Folder Drive Sekarang
          </button>
        </div>
      )}

      {/* Folder Kosong */}
      {!loading && !error && folderLinks.length > 0 && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <Film size={48} className="text-gray-700" />
          <h3 className="text-gray-300 font-bold text-lg">Folder Kosong</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Tidak ada file video ditemukan di folder yang terhubung. Pastikan folder berisi file video (.mp4, .mkv, .webm) dan link diset ke "Anyone with the link can view".
          </p>
          <button
            onClick={() => setShowManageModal(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 border border-white/10"
          >
            Kelola Folder
          </button>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && filteredVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Menampilkan {filteredVideos.length} Video {activeDriveFilter !== "all" ? `(Drive ${activeDriveFilter})` : `(Total)`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredVideos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.4) }}
                className="group bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/40 shadow-lg cursor-pointer transition-all hover:shadow-indigo-500/10 hover:-translate-y-0.5"
                onClick={() => setPlayingVideo(video)}
              >
                <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                  {video.thumbnail ? (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity duration-300" 
                    />
                  ) : (
                    <Film size={28} className="text-gray-700" />
                  )}

                  {/* Drive Badge */}
                  {folderLinks.length > 1 && video.driveLabel && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-indigo-300 font-bold text-[10px] border border-white/10 shadow">
                        {video.driveLabel}
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-indigo-600/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-110 transition-transform">
                      <Play size={20} className="text-white ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors mb-2">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {video.duration && <span className="flex items-center gap-1"><Clock size={11}/> {video.duration}</span>}
                    {video.size && <span className="flex items-center gap-1"><HardDrive size={11}/> {video.size}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && videos.length > 0 && filteredVideos.length === 0 && (
        <div className="py-20 text-center text-gray-400 text-sm">
          Tidak ada video yang cocok dengan pencarian "{searchQuery}".
        </div>
      )}
    </div>
  );
}
