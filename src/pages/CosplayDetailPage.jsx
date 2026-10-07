import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getCosplayDetail } from "../services/cosplayService";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Play,
  X,
  Maximize2,
  Sparkles,
  Loader2,
  Share2,
} from "lucide-react";

export default function CosplayDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCosplayDetail(slug);
        setData(detail);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={18} className="text-pink-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-pink-300">
          Memuat Galeri Cosplay...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="glass-card p-8 rounded-3xl max-w-md border border-white/10 shadow-2xl">
          <h2 className="text-2xl font-bold mb-3 text-rose-400">
            {error ? "Gagal Memuat Konten" : "Konten Tidak Ditemukan"}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {error || "Set cosplay yang diminta tidak ditemukan atau telah dihapus."}
          </p>
          <Link
            to="/cosplay"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-pink-500/20"
          >
            <ArrowLeft size={16} /> Kembali ke Galeri
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-14 px-3.5 sm:px-6 md:px-8">
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage}
                alt="Full Preview"
                className="max-h-[82vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <div className="mt-4 flex gap-3">
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full glass-card hover:border-pink-500/50 text-xs font-semibold text-pink-300 flex items-center gap-2 transition-all"
                >
                  <ExternalLink size={14} /> Buka Gambar Asli
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Navigation Topbar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/cosplay"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-pink-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Galeri Cosplay
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-pink-500/10 text-pink-300 border border-pink-500/30">
              Cosplay Set
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight font-display mb-4">
            {data.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-white/5">
            {data.images && (
              <span className="flex items-center gap-1.5 text-pink-300">
                <ImageIcon size={14} /> {data.images.length} Foto
              </span>
            )}
            {data.videoIframes && data.videoIframes.length > 0 && (
              <span className="flex items-center gap-1.5 text-rose-300">
                <Play size={14} /> {data.videoIframes.length} Video
              </span>
            )}
            {data.downloadLinks && data.downloadLinks.length > 0 && (
              <span className="flex items-center gap-1.5 text-purple-300">
                <Download size={14} /> {data.downloadLinks.length} Tautan Unduh
              </span>
            )}
          </div>
        </div>

        {/* Video Players Section */}
        {data.videoIframes && data.videoIframes.length > 0 && (
          <div className="space-y-6 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                <Play size={18} />
              </div>
              <h2 className="text-xl font-bold text-white">
                Video Stream ({data.videoIframes.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {data.videoIframes.map((iframeSrc, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl overflow-hidden glass-card border border-white/15 shadow-2xl shadow-pink-950/20 bg-black"
                >
                  <div className="aspect-video w-full bg-black">
                    <iframe
                      src={iframeSrc}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                      title={`Cosplay Video ${idx + 1}`}
                    />
                  </div>
                  <div className="p-3 bg-neutral-950/90 flex items-center justify-between border-t border-white/10 text-xs text-gray-400">
                    <span>Pemutar Video #{idx + 1}</span>
                    <a
                      href={iframeSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 inline-flex items-center gap-1.5 font-medium transition-colors"
                    >
                      <ExternalLink size={13} /> Putar di Tab Baru
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Buttons Section */}
        {data.downloadLinks && data.downloadLinks.length > 0 && (
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Download size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Tautan Unduhan</h3>
                <p className="text-xs text-gray-400">
                  Unduh seluruh resolusi asli melalui penyedia penyimpanan file berikut
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {data.downloadLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600/30 to-purple-600/30 hover:from-pink-600 hover:to-purple-600 border border-pink-500/30 hover:border-pink-400 text-white font-semibold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg shadow-pink-600/10 hover:shadow-pink-600/30 hover:-translate-y-0.5"
                >
                  <span>{link.label || `Server Unduh #${idx + 1}`}</span>
                  <ExternalLink size={14} className="text-pink-300" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery Grid */}
        {data.images && data.images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Galeri Foto</h3>
                  <p className="text-xs text-gray-400">
                    Klik foto untuk memperbesar atau melihat dalam resolusi penuh
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-300">
                {data.images.length} Foto
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {data.images.map((imgSrc, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(imgSrc)}
                  className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-pink-500/50 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-500/10 aspect-[2/3] bg-neutral-900/60"
                >
                  <img
                    src={imgSrc}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                    <span className="text-[11px] font-semibold text-white/80">
                      Foto #{idx + 1}
                    </span>
                    <div className="p-2 rounded-full bg-pink-500 text-white shadow-lg shadow-pink-500/40">
                      <Maximize2 size={13} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
