import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  ExternalLink,
  Loader2,
  Camera,
  Play,
  X,
  Sparkles,
  Maximize2,
  Download,
} from "lucide-react";
import { getFapelloModel } from "../services/fapelloService";
import FavoriteButton from "../components/FavoriteButton";
import { downloadMedia, getSafeFilename } from "../utils/downloadHelper";

export default function FapelloDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await getFapelloModel(decodedSlug);
        setData(res);
      } catch (e) {
        setError(
          "Gagal memuat profil model. " + (e.response?.data?.error || e.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  const handleDownloadMedia = async (media) => {
    if (!media) return;
    const targetUrl = media.full_url || media.cover_url;
    if (!targetUrl) return;

    setDownloading(true);
    const filename = getSafeFilename(
      `${data?.name || "fapello"}_post_${media.id || Date.now()}`,
      targetUrl,
      media.is_video ? "video" : "photo"
    );
    try {
      await downloadMedia(targetUrl, filename, { referer: "https://fapello.com/" });
    } catch (err) {
      console.error("Gagal mengunduh media:", err);
      alert("Gagal mengunduh: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera size={18} className="text-rose-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-rose-300">
          Memuat Profil Model Fapello...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="glass-card p-8 rounded-3xl max-w-md border border-white/10 shadow-2xl">
          <h2 className="text-xl font-bold mb-2 text-rose-400">Gagal Memuat Model</h2>
          <p className="text-gray-400 text-sm mb-6">{error || "Model tidak ditemukan."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Daftar Model
          </button>

          {data?.original_url && (
            <a
              href={data.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 text-xs font-semibold transition-all"
            >
              <span>Profil Asli Fapello</span>
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Profile Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden glass-card border-2 border-rose-500/40 flex-shrink-0 shadow-xl shadow-rose-950/40 relative group bg-neutral-900">
              {data?.avatar ? (
                <img
                  src={data.avatar}
                  alt={data.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <Camera size={36} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles size={12} className="text-rose-400" /> Featured Model
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-display">
                  {data?.name}
                </h1>
                <div className="flex justify-center sm:justify-end">
                  <FavoriteButton
                    item={{
                      id: `fapello_${data.slug}`,
                      title: data.name || data.slug,
                      cover_url: data.avatar || data.posts?.[0]?.cover_url,
                      link: `/fapello/${encodeURIComponent(data.slug)}`,
                      type: "Creator / Model",
                      source: "Fapello",
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs">
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-card border border-rose-500/30 text-rose-300 font-semibold shadow-md">
                  <Users size={14} className="text-rose-400" />
                  {data?.followers || "0"} Pengikut
                </span>
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-card border border-white/10 text-gray-300 font-medium">
                  <Camera size={14} className="text-gray-400" />
                  {data?.posts?.length || 0} Media Terkumpul
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Gallery */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera size={18} className="text-rose-400" /> Galeri Media
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              {data?.posts?.length || 0} Postingan
            </span>
          </div>

          {data?.posts?.length === 0 ? (
            <div className="glass-card p-12 text-center rounded-3xl text-gray-500 text-sm">
              Belum ada media untuk model ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {data?.posts?.map((post, i) => (
                <motion.div
                  key={post.id || i}
                  whileHover={{ scale: 1.02 }}
                  className="relative cursor-pointer rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-900 glass-card border border-white/10 hover:border-rose-500/50 group shadow-md"
                  onClick={() => setSelectedMedia(post)}
                >
                  <img
                    src={post.cover_url}
                    alt={`Post ${i}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                    <span className="text-[11px] font-bold text-white">Media #{i + 1}</span>
                    <div className="p-1.5 rounded-full bg-rose-600 text-white shadow-lg">
                      {post.is_video ? <Play size={12} className="fill-white" /> : <Maximize2 size={12} />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
                onClick={() => setSelectedMedia(null)}
              >
                <X size={20} />
              </button>

              {selectedMedia.is_video ? (
                <div className="flex flex-col items-center gap-6 glass-card p-8 rounded-3xl border border-white/10 max-w-lg text-center">
                  <div className="relative rounded-2xl overflow-hidden border border-white/20 max-h-[50vh] aspect-video w-full bg-black">
                    <img
                      src={selectedMedia.cover_url}
                      alt="Cover"
                      className="w-full h-full object-cover opacity-60 blur-xs"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-rose-600/90 flex items-center justify-center shadow-xl">
                        <Play size={32} className="text-white fill-white ml-1" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Video Eksklusif Model</h4>
                    <p className="text-xs text-gray-400 mb-4">
                      Video streaming beresolusi tinggi tersedia di pemutar web Fapello
                    </p>
                    <a
                      href={selectedMedia.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-full font-bold text-sm inline-flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105"
                    >
                      Tonton Video di Fapello <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ) : (
                <img
                  src={selectedMedia.full_url || selectedMedia.cover_url}
                  alt="Fullscreen view"
                  className="max-h-[82vh] w-auto object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              )}

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {!selectedMedia.is_video && (
                  <button
                    type="button"
                    onClick={() => handleDownloadMedia(selectedMedia)}
                    disabled={downloading}
                    className="px-4 py-2 rounded-full glass-card hover:border-rose-500/50 text-xs font-semibold text-rose-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    title="Unduh foto ini"
                  >
                    {downloading ? (
                      <Loader2 size={14} className="animate-spin text-cyan-400" />
                    ) : (
                      <Download size={14} className="text-cyan-400" />
                    )}
                    <span>Unduh Foto</span>
                  </button>
                )}

                <a
                  href={selectedMedia.href || selectedMedia.full_url || selectedMedia.cover_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-full glass-card hover:border-rose-500/50 text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-all"
                >
                  <ExternalLink size={14} /> Buka di Tab Baru
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
