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
  Download
} from "lucide-react";

const STORAGE_KEY = "apicos_drive_folder_link";

export default function PersonalVideoPage() {
  const [folderLink, setFolderLink] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [inputValue, setInputValue] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const [showInput, setShowInput] = useState(!localStorage.getItem(STORAGE_KEY));
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setPlayingVideo(null);
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
        if (isMounted && res.data?.success && res.data.folderLink) {
          const remoteLink = res.data.folderLink;
          setFolderLink(remoteLink);
          setInputValue(remoteLink);
          localStorage.setItem(STORAGE_KEY, remoteLink);
          setShowInput(false);
          fetchVideos(remoteLink);
          return;
        }
      } catch (err) {
        console.warn("Gagal mengambil konfigurasi Google Drive dari server:", err);
      } finally {
        if (isMounted) setIsConfigLoaded(true);
      }

      // Fallback: jika di database belum ada, cek localStorage
      const localLink = localStorage.getItem(STORAGE_KEY);
      if (localLink) {
        setFolderLink(localLink);
        setInputValue(localLink);
        setShowInput(false);
        fetchVideos(localLink);
      } else {
        setShowInput(true);
      }
    }

    loadServerConfig();
    return () => { isMounted = false; };
  }, []);

  const fetchVideos = async (link) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/personal/drive", {
        params: { folderLink: link }
      });
      if (res.data.success) {
        setVideos(res.data.data || []);
      } else {
        throw new Error(res.data.error || "Gagal memuat video");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal mengambil video dari Google Drive");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFolder = async () => {
    const cleanLink = inputValue.trim();
    if (!cleanLink) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Simpan permanen ke MongoDB
      const res = await axios.post("/api/personal/drive/config", { folderLink: cleanLink });
      const savedLink = res.data?.folderLink || cleanLink;

      localStorage.setItem(STORAGE_KEY, savedLink);
      setFolderLink(savedLink);
      setInputValue(savedLink);
      setShowInput(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      fetchVideos(savedLink);
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || "Gagal menyimpan link folder ke database.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFolder = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus tautan folder Google Drive ini?")) {
      return;
    }

    try {
      await axios.delete("/api/personal/drive/config");
    } catch (err) {
      console.warn("Gagal menghapus link di server:", err);
    }

    localStorage.removeItem(STORAGE_KEY);
    setFolderLink("");
    setInputValue("");
    setVideos([]);
    setShowInput(true);
    setError(null);
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setInputValue(folderLink);
    setSaveError(null);
    setShowInput(false);
  };

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
                  <h3 className="font-bold text-white truncate text-sm sm:text-base">{playingVideo.title}</h3>
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

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Film size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Video Pribadi</h1>
              {folderLink && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database size={11} /> Tersimpan Permanen
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
              <span>Stream dari folder Google Drive Anda</span>
              {folderLink && (
                <span className="sm:hidden inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Database size={9} /> Tersimpan
                </span>
              )}
            </p>
          </div>
        </div>

        {folderLink && !showInput && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button 
              onClick={() => fetchVideos(folderLink)} 
              disabled={loading}
              className="px-3.5 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => {
                setInputValue(folderLink);
                setShowInput(true);
              }} 
              className="px-3.5 py-2 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-300 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
            >
              <LinkIcon size={13}/>
              <span>Ganti Folder</span>
            </button>
          </div>
        )}
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          >
            <Check size={18} className="text-emerald-400 shrink-0" />
            <span>Link Google Drive berhasil disimpan permanen ke database! Link tidak akan hilang saat update file.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Folder Link Form */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 bg-neutral-900/90 border border-indigo-500/20 rounded-2xl p-5 md:p-6 backdrop-blur-sm shadow-xl"
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-400"/> 
                {folderLink ? "Ubah Link Folder Google Drive" : "Hubungkan Folder Google Drive"}
              </h2>
              {folderLink && (
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                  title="Tutup / Batal"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Link folder ini akan <strong className="text-indigo-300">tersimpan permanen di cloud database</strong>, sehingga tidak akan hilang saat file di-update atau ganti perangkat. Pastikan izin sharing folder di Google Drive sudah diatur ke <strong className="text-gray-200">"Anyone with the link can view"</strong>.
            </p>

            {saveError && (
              <div className="mb-4 bg-red-500/15 border border-red-500/30 text-red-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-400" />
                <span>{saveError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isSaving && handleSaveFolder()}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                disabled={isSaving}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveFolder}
                  disabled={!inputValue.trim() || isSaving}
                  className="flex-1 sm:flex-none px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-600/30"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16}/> 
                      <span>{folderLink ? "Simpan Perubahan" : "Simpan Link"}</span>
                    </>
                  )}
                </button>
                {folderLink && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-40"
                  >
                    Batal
                  </button>
                )}
              </div>
            </div>

            {folderLink && (
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate max-w-[280px] sm:max-w-md">
                  Aktif: <span className="text-gray-400 font-mono">{folderLink}</span>
                </span>
                <button 
                  onClick={handleClearFolder} 
                  className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 shrink-0"
                >
                  <Trash2 size={12}/> Hapus Tautan
                </button>
              </div>
            )}

            {/* Panduan API Key jika diperlukan */}
            {isApiKeyNotSet && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle size={14}/> Google Drive API Key Diperlukan
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Tambahkan <code className="bg-black/30 px-1.5 py-0.5 rounded text-yellow-300 font-mono">GOOGLE_DRIVE_API_KEY</code> ke Environment Variables server/Vercel Anda. Buat API Key gratis di <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Cloud Console</a> → Aktifkan Google Drive API → Credentials → Create API Key.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400 animate-pulse">Mengambil video dari Google Drive...</p>
        </div>
      )}

      {/* Error state (bukan API Key) */}
      {!loading && error && !isApiKeyNotSet && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle size={40} className="text-red-400/60" />
          <p className="text-red-400 text-sm max-w-md">{error}</p>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchVideos(folderLink)} 
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors border border-white/10"
            >
              Coba Lagi
            </button>
            <button 
              onClick={() => setShowInput(true)} 
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl text-sm transition-colors border border-indigo-500/30"
            >
              Periksa Link Folder
            </button>
          </div>
        </div>
      )}

      {/* Folder Kosong */}
      {!loading && !error && folderLink && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <Film size={48} className="text-gray-700" />
          <h3 className="text-gray-300 font-bold text-lg">Folder Kosong</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Tidak ada file video ditemukan di folder tersebut. Pastikan folder berisi file video (format .mp4, .mkv, .webm, dll) dan link berbagi diset ke "Anyone with the link".
          </p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && videos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Ditemukan {videos.length} Video
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {videos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
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
    </div>
  );
}
