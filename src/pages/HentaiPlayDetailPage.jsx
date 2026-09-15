import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Loader2, AlertCircle, Film, Tag, Heart } from "lucide-react";
import { getHentaiPlayVideo } from "../services/hentaiPlayService";
import { useFavorites } from "../hooks/useFavorites";

export default function HentaiPlayDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
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
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-rose-900/10 bg-black aspect-video relative group cursor-pointer"
            onClick={() => window.open(data.original_url, '_blank')}
          >
            {/* Thumbnail Background */}
            {data.cover_url && (
              <img
                src={data.cover_url}
                alt={data.title}
                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300"
              />
            )}
            {/* Overlay + Play Button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-rose-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-rose-500/50 group-hover:scale-110 transition-transform duration-300 border border-rose-400/30">
                <Film size={36} className="text-white ml-1" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base drop-shadow-lg">Klik untuk Tonton</p>
                <p className="text-rose-300 text-xs mt-1">Membuka di HentaiPlay.net</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Title & Info */}
        <div className="mb-6 flex items-start gap-4 justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3 leading-tight">{data.title}</h2>
            {data.description && (
              <p className="text-sm text-gray-400 leading-relaxed">{data.description}</p>
            )}
          </div>
          <button
            onClick={() => toggleFavorite({
              id: slug,
              link: `/hentaiplay/video/${encodeURIComponent(slug)}`,
              title: data.title,
              cover_url: data.cover_url,
              type: "Video",
              source: "HentaiPlay"
            })}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${
              isFavorite(slug) || isFavorite(`/hentaiplay/video/${encodeURIComponent(slug)}`)
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-rose-400"
            }`}
          >
            <Heart size={24} className={isFavorite(slug) || isFavorite(`/hentaiplay/video/${encodeURIComponent(slug)}`) ? "fill-white" : ""} />
          </button>
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
