import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Film, Loader2, AlertCircle, FolderOpen, X, Play, Clock, HardDrive, Link as LinkIcon, Check } from "lucide-react";

const STORAGE_KEY = "apicos_drive_folder_link";

export default function PersonalVideoPage() {
  const [folderLink, setFolderLink] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [inputValue, setInputValue] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [showInput, setShowInput] = useState(!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    if (folderLink) {
      fetchVideos(folderLink);
    }
  }, [folderLink]);

  const fetchVideos = async (link) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/personal/drive", {
        params: { folderLink: link }
      });
      if (res.data.success) {
        setVideos(res.data.data);
      } else {
        throw new Error(res.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal mengambil video dari Google Drive");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFolder = () => {
    if (!inputValue.trim()) return;
    localStorage.setItem(STORAGE_KEY, inputValue.trim());
    setFolderLink(inputValue.trim());
    setShowInput(false);
  };

  const handleClearFolder = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFolderLink("");
    setInputValue("");
    setVideos([]);
    setShowInput(true);
  };

  const isApiKeyNotSet = error && error.includes("API_KEY_NOT_SET");

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">

      {/* Video Player Modal */}
      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-md"
          >
            {/* Absolute Close Button */}
            <button
              onClick={() => setPlayingVideo(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-[110] p-3 rounded-full bg-white/10 hover:bg-red-500 text-white transition-all backdrop-blur-md"
            >
              <X size={24} />
            </button>
            
            <div className="w-full max-w-5xl flex flex-col bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
              <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 pr-16">
                <h3 className="font-bold text-white line-clamp-1 text-sm md:text-base">{playingVideo.title}</h3>
              </div>
              <div className="aspect-video bg-black relative">
                <video
                  src={playingVideo.stream_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-3 flex items-center justify-between text-xs text-gray-500 shrink-0">
                <div className="flex items-center gap-4">
                  {playingVideo.duration && <span className="flex items-center gap-1"><Clock size={12}/> {playingVideo.duration}</span>}
                  {playingVideo.size && <span className="flex items-center gap-1"><HardDrive size={12}/> {playingVideo.size}</span>}
                </div>
                <a href={playingVideo.download_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Buka di Drive
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Film size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Video Pribadi</h1>
            <p className="text-xs text-gray-500">Stream dari Google Drive Anda</p>
          </div>
        </div>
        {folderLink && !showInput && (
          <div className="flex items-center gap-2">
            <button onClick={() => fetchVideos(folderLink)} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all">
              Refresh
            </button>
            <button onClick={() => setShowInput(true)} className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-all flex items-center gap-1">
              <LinkIcon size={12}/> Ganti Folder
            </button>
          </div>
        )}
      </div>

      {/* Input Folder Link */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <h2 className="font-bold text-white mb-1 flex items-center gap-2">
              <FolderOpen size={18} className="text-indigo-400"/> Hubungkan Folder Google Drive
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Buka Google Drive → klik kanan folder video Anda → <strong className="text-gray-300">Share</strong> → ubah ke <strong className="text-gray-300">"Anyone with the link"</strong> → copy & paste link-nya di sini.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveFolder()}
                placeholder="https://drive.google.com/drive/folders/..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
              <button
                onClick={handleSaveFolder}
                disabled={!inputValue.trim()}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <Check size={16}/> Simpan
              </button>
            </div>
            {folderLink && (
              <button onClick={handleClearFolder} className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors">
                Hapus folder yang tersimpan
              </button>
            )}

            {/* Panduan API Key */}
            {isApiKeyNotSet && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <h4 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2"><AlertCircle size={14}/> API Key Diperlukan</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Tambahkan <code className="bg-black/30 px-1.5 py-0.5 rounded text-yellow-300">GOOGLE_DRIVE_API_KEY</code> ke Vercel Environment Variables Anda. Buat API Key gratis di <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Cloud Console</a> → Aktifkan Google Drive API → Credentials → Create API Key.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400 animate-pulse">Mengambil video dari Google Drive...</p>
        </div>
      )}

      {/* Error (bukan API Key) */}
      {!loading && error && !isApiKeyNotSet && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle size={40} className="text-red-400/60" />
          <p className="text-red-400 text-sm max-w-md">{error}</p>
          <button onClick={() => fetchVideos(folderLink)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Kosong */}
      {!loading && !error && folderLink && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <Film size={48} className="text-gray-700" />
          <h3 className="text-gray-300 font-bold text-lg">Folder Kosong</h3>
          <p className="text-gray-500 text-sm max-w-sm">Tidak ada file video ditemukan di folder tersebut. Pastikan folder berisi file video (.mp4, dll).</p>
        </div>
      )}

      {/* Video Grid */}
      {!loading && !error && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group bg-neutral-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 shadow-lg cursor-pointer transition-all"
              onClick={() => setPlayingVideo(video)}
            >
              <div className="aspect-video relative overflow-hidden bg-black flex items-center justify-center">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
                ) : (
                  <Film size={28} className="text-gray-700" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/90 backdrop-blur-sm flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-110 transition-transform">
                    <Play size={20} className="text-white ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-200 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors mb-2">{video.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  {video.duration && <span className="flex items-center gap-1"><Clock size={10}/> {video.duration}</span>}
                  {video.size && <span className="flex items-center gap-1"><HardDrive size={10}/> {video.size}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
