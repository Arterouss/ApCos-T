import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Camera, AlertCircle, X, ZoomIn } from "lucide-react";

export default function PersonalPhotoPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/personal/photos");
      if (res.data.success) {
        setPhotos(res.data.data);
      } else {
        throw new Error(res.data.error || "Gagal memuat foto");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  const isTokenNotSet = error && (error.includes("TOKEN_NOT_SET") || error.includes("Token"));

  return (
    <div className="min-h-screen text-white pt-6 md:pt-16 px-3.5 sm:px-6 md:px-8 pb-20">

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || "Foto Pribadi"}
              className="max-h-[92vh] max-w-full object-contain rounded-xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            {selectedPhoto.caption && (
              <p className="absolute bottom-6 left-0 right-0 text-center text-sm text-gray-300 px-4">
                {selectedPhoto.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Camera size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Foto Pribadi</h1>
            <p className="text-xs text-gray-500">Foto yang Anda kirim ke Bot Telegram</p>
          </div>
        </div>
        {!loading && !error && (
          <button
            onClick={fetchPhotos}
            className="px-4 py-2 text-xs bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            Refresh
          </button>
        )}
      </div>

      {/* Setup Guide jika token belum diset */}
      {isTokenNotSet && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 max-w-xl mx-auto mt-16 text-center">
          <Camera size={40} className="mx-auto mb-4 text-blue-400" />
          <h3 className="font-bold text-white mb-2">Setup Bot Telegram Diperlukan</h3>
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            Tambahkan <code className="bg-white/10 px-2 py-0.5 rounded text-xs text-blue-300">TELEGRAM_BOT_TOKEN</code> ke Vercel Environment Variables Anda, lalu Redeploy.
          </p>
          <div className="bg-black/30 rounded-xl p-3 text-left text-xs text-gray-400 font-mono">
            <p>Key: <span className="text-blue-300">TELEGRAM_BOT_TOKEN</span></p>
            <p>Value: <span className="text-gray-500">token dari @BotFather</span></p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 size={40} className="animate-spin text-blue-400" />
          <p className="text-sm text-gray-400 animate-pulse">Mengambil foto dari Telegram...</p>
        </div>
      )}

      {/* Error lain */}
      {!loading && error && !isTokenNotSet && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <AlertCircle size={40} className="text-red-400/60" />
          <p className="text-red-400 text-sm max-w-md">{error}</p>
          <button onClick={fetchPhotos} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
            Coba Lagi
          </button>
        </div>
      )}

      {/* Kosong */}
      {!loading && !error && photos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <Camera size={48} className="text-gray-700" />
          <h3 className="text-gray-300 font-bold text-lg">Belum Ada Foto</h3>
          <p className="text-gray-500 text-sm max-w-sm">
            Kirimkan foto apapun ke <strong className="text-blue-400">@inimyvideo_bot</strong> di Telegram Anda, lalu tekan Refresh.
          </p>
          <button onClick={fetchPhotos} className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            Refresh Sekarang
          </button>
        </div>
      )}

      {/* Foto Grid */}
      {!loading && !error && photos.length > 0 && (
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative group break-inside-avoid rounded-xl overflow-hidden bg-neutral-900 cursor-pointer border border-white/5 hover:border-blue-500/40 transition-all shadow-lg"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || `Foto ${i + 1}`}
                className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-gray-200 line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
