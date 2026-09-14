import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Loader2, Play, AlertCircle, Film, FolderLock, ExternalLink } from "lucide-react";

export default function PersonalVideoPage({ onOpenSidebar }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/personal/videos");
      if (res.data.success) {
        setVideos(res.data.data);
      } else {
        throw new Error(res.data.error || "Gagal memuat video");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <FolderLock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Koleksi Pribadi</h1>
            <p className="text-xs text-gray-500">Video private dari Telegram Anda</p>
          </div>
        </div>
        
        {/* Panduan Setup */}
        {error && error.includes("Token") && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-lg">
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-2">
              <AlertCircle size={16} /> Setup Diperlukan
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Anda belum mengatur <strong>Telegram Bot Token</strong>. Untuk mengaktifkan fitur ini, Anda perlu membuat Bot Telegram gratis via @BotFather, lalu masukkan tokennya di file <code>api/telegramVideo.js</code> atau di Environment Variables Vercel.
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-indigo-500">
          <Loader2 size={48} className="animate-spin mb-4" />
          <p className="text-sm font-medium animate-pulse text-gray-300">Menyinkronkan dari Telegram...</p>
        </div>
      ) : error && !error.includes("Token") ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-4 text-center">
          <AlertCircle size={48} className="text-red-500/50" />
          <p className="text-red-400 max-w-md">{error}</p>
          <button 
            onClick={fetchVideos}
            className="px-4 py-2 mt-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      ) : videos.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 gap-4 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-2 border border-white/10">
            <Film size={32} className="text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-300">Belum Ada Video</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Kirim file video (.mp4) ke Bot Telegram Anda, lalu refresh halaman ini untuk melihatnya.
          </p>
          <button 
            onClick={fetchVideos}
            className="px-6 py-2.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            Refresh Koleksi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-neutral-900 rounded-xl overflow-hidden border border-white/5 shadow-lg group"
            >
              <div 
                className="aspect-video relative bg-black flex items-center justify-center overflow-hidden cursor-pointer"
                onClick={() => setPlayingVideo(video)}
              >
                {/* Gunakan thumbnail jika ada, jika tidak icon film */}
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <Film size={32} className="text-gray-700" />
                )}
                
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/80 backdrop-blur-sm flex items-center justify-center text-white transform scale-90 group-hover:scale-110 transition-transform">
                    <Play size={20} className="ml-1" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-200 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                  {video.title}
                </h3>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(video.date).toLocaleDateString()}</span>
                  {video.duration && <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Video Player Modal */}
      {playingVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <h3 className="font-bold text-white line-clamp-1 pr-4">{playingVideo.title}</h3>
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-2 bg-white/10 hover:bg-red-500 text-white rounded-full transition-colors shrink-0"
              >
                <AlertCircle size={20} className="rotate-45" /> {/* Close Icon */}
              </button>
            </div>
            <div className="relative aspect-video bg-black shrink-0">
              <video 
                src={playingVideo.video_url} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-neutral-900 text-xs text-gray-500 flex justify-between shrink-0">
              <span>Diunggah pada: {new Date(playingVideo.date).toLocaleString()}</span>
              <a href={playingVideo.video_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                Buka Link Asli <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
