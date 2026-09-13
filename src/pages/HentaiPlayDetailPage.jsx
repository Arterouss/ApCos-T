import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2, AlertCircle, Film, Tag } from "lucide-react";
import { getHentaiPlayVideo } from "../services/hentaiPlayService";

export default function HentaiPlayDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await getHentaiPlayVideo(decodedSlug);
        setData(res);
      } catch (e) {
        setError("Gagal memuat video. " + (e.message || ""));
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-rose-400 animate-spin" />
          <p className="text-gray-500 text-sm">Memuat video...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="text-red-400 text-sm">{error || "Video tidak ditemukan"}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm hover:bg-rose-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Navbar */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-semibold text-sm text-white line-clamp-1 flex-1">
          {data.title || "Video"}
        </h1>
        <a
          href={data.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition-all"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Video Player Section */}
        <div className="mb-6">
          {data.embed_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-rose-900/10 bg-black aspect-video"
            >
              <iframe
                src={data.embed_url}
                title={data.title}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                frameBorder="0"
              />
            </motion.div>
          ) : (
            // No embed URL - show cover with link to original
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 aspect-video flex flex-col items-center justify-center gap-6 relative"
            >
              {data.cover_url && (
                <img
                  src={data.cover_url}
                  alt={data.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <Film size={48} className="text-gray-600" />
                <p className="text-sm text-gray-400 text-center px-8">
                  Video player tidak dapat dimuat secara otomatis.
                </p>
                <a
                  href={data.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                >
                  Tonton di HentaiPlay <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Title & Info */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">{data.title}</h2>
          {data.description && (
            <p className="text-sm text-gray-400 leading-relaxed">{data.description}</p>
          )}
        </div>

        {/* Tags */}
        {data.tags?.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={14} className="text-rose-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Open Original Button */}
        <a
          href={data.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-rose-600/20 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 rounded-xl text-sm transition-all"
        >
          <ExternalLink size={14} />
          Buka di HentaiPlay.net
        </a>
      </div>
    </div>
  );
}
