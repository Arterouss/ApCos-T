import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Camera, AlertCircle, X, ZoomIn, Trash2, RefreshCw, Send, Sparkles } from "lucide-react";

const HIDDEN_KEY = "apicos_hidden_photos";

export default function PersonalPhotoPage({ onOpenSidebar }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("Semua");
  const [hiddenIds, setHiddenIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]")); }
    catch { return new Set(); }
  });

  const deletePhoto = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto ini selamanya?")) return;

    setHiddenIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      await axios.delete(`/api/personal/photos?id=${encodeURIComponent(id)}`);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Gagal menghapus foto:", err);
      setHiddenIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert("Gagal menghapus foto.");
    }
  };

  const categories = ["Semua", "MyGoon", "Cosplay", "Gravure"];

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
    <div className="min-h-screen text-white pt-6 md:pt-10 px-4 sm:px-6 md:px-8 pb-24 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-blue-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/[0.05] blur-[170px]" />
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              className="absolute top-5 right-5 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              onClick={() => setSelectedPhoto(null)}
            >
              <X size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || "Foto Pribadi"}
              className="max-h-[90vh] max-w-full object-contain rounded-2xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            {selectedPhoto.caption && (
              <p className="absolute bottom-6 left-0 right-0 text-center text-xs sm:text-sm text-gray-300 px-4 drop-shadow">
                {selectedPhoto.caption}
              </p>
            )}
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
                background: 'rgba(0, 229, 255, 0.1)',
                color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            >
              <Camera size={12} />
              <span>Telegram Photo Vault</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400">
                Foto Pribadi
              </span>
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed">
              Koleksi foto pribadi yang Anda kirimkan ke Bot Telegram ApiCos.
            </p>
          </div>

          {!loading && !error && (
            <button
              onClick={fetchPhotos}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <RefreshCw size={13} />
              <span>Refresh Vault</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        {!loading && !error && photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer ${
                  activeTab === cat ? "text-black shadow-lg" : "text-gray-400 hover:text-white"
                }`}
                style={{
                  background: activeTab === cat
                    ? 'linear-gradient(135deg, #00e5ff, #0070f3)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: activeTab === cat
                    ? '1px solid rgba(0, 229, 255, 0.8)'
                    : '1px solid rgba(255, 255, 255, 0.06)',
                  boxShadow: activeTab === cat ? '0 0 15px rgba(0, 229, 255, 0.35)' : 'none',
                }}
              >
                {cat === "Semua" ? "Semua" : `#${cat}`}
              </button>
            ))}
          </div>
        )}

        {/* Setup Guide jika token belum diset */}
        {isTokenNotSet && (
          <div
            className="rounded-3xl p-8 max-w-xl mx-auto my-12 text-center"
            style={{
              background: 'rgba(14, 16, 26, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <Camera size={44} className="mx-auto mb-4 text-neon-cyan" />
            <h3 className="font-display font-black text-white text-xl mb-2">Setup Bot Telegram Diperlukan</h3>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed mb-6">
              Tambahkan <code className="bg-white/10 px-2 py-0.5 rounded text-xs text-neon-cyan font-mono">TELEGRAM_BOT_TOKEN</code> ke Environment Variables Anda, lalu restart server.
            </p>
            <div
              className="rounded-2xl p-4 text-left text-xs font-mono space-y-1"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <p>Key: <span className="text-neon-cyan">TELEGRAM_BOT_TOKEN</span></p>
              <p>Value: <span className="text-gray-500">token dari @BotFather</span></p>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl aspect-[3/4] bg-white/[0.04] relative overflow-hidden animate-pulse"
                style={{
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && !isTokenNotSet && (
          <div
            className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
            style={{
              background: 'rgba(18, 18, 28, 0.5)',
              border: '1px solid rgba(255, 45, 85, 0.2)',
            }}
          >
            <AlertCircle size={40} className="text-neon-red" />
            <p className="text-neon-red text-sm">{error}</p>
            <button
              onClick={fetchPhotos}
              className="px-5 py-2.5 rounded-xl text-black text-xs font-bold transition-all cursor-pointer"
              style={{ background: '#00e5ff' }}
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Kosong */}
        {!loading && !error && photos.length === 0 && (
          <div
            className="py-24 text-center rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center gap-4"
            style={{
              background: 'rgba(14, 16, 26, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center text-gray-500">
              <Camera size={32} />
            </div>
            <h3 className="text-white font-bold text-lg">Belum Ada Foto</h3>
            <p className="text-gray-400 text-xs">
              Kirimkan foto ke bot Telegram Anda, lalu tekan tombol Refresh untuk memunculkannya di sini.
            </p>
            <button
              onClick={fetchPhotos}
              className="px-6 py-2.5 rounded-xl text-black text-xs font-bold transition-all cursor-pointer"
              style={{ background: '#00e5ff' }}
            >
              Refresh Sekarang
            </button>
          </div>
        )}

        {/* Photo Masonry Grid */}
        {!loading && !error && photos.length > 0 && (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 space-y-3">
            {photos
              .filter(photo => !hiddenIds.has(photo.id))
              .filter(photo => {
                if (activeTab === "Semua") return true;
                const caption = (photo.caption || "").toLowerCase();
                return caption.includes(`#${activeTab.toLowerCase()}`);
              })
              .map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="relative group break-inside-avoid rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                  style={{
                    background: 'rgba(14, 16, 26, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.4)';
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(0, 229, 255, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Foto ${i + 1}`}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: '#00e5ff',
                        boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)',
                      }}
                    >
                      <ZoomIn size={20} className="text-black" />
                    </div>
                  </div>

                  {/* Trash Button */}
                  <button
                    onClick={(e) => deletePhoto(photo.id, e)}
                    className="absolute top-2.5 right-2.5 p-2 rounded-xl text-neon-red opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                    style={{
                      background: 'rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 45, 85, 0.3)',
                    }}
                    title="Hapus foto permanen"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Caption */}
                  {photo.caption && (
                    <div className="absolute bottom-0 inset-x-0 p-3 pt-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <p className="text-xs text-gray-200 line-clamp-2 leading-tight">
                        {photo.caption}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
