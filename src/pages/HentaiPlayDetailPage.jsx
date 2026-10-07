import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  AlertCircle,
  Play,
  Film,
  Tag,
  Heart,
  Sparkles,
  Share2,
} from "lucide-react";
import { getHentaiPlayVideo } from "../services/hentaiPlayService";
import { useFavorites } from "../hooks/useFavorites";
import { filterBlockedTags } from "../utils/contentFilter";

export default function HentaiPlayDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
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
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film size={18} className="text-rose-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-rose-300">
          Memuat Pemutar HentaiPlay...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="glass-card p-8 rounded-3xl max-w-md border border-white/10 shadow-2xl">
          <AlertCircle size={44} className="mx-auto text-rose-500 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-white">Gagal Memuat Video</h2>
          <p className="text-gray-400 text-sm mb-6">{error || "Video tidak ditemukan."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-600/30"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const favoriteActive =
    isFavorite(slug) ||
    isFavorite(`/hentaiplay/video/${encodeURIComponent(slug)}`);

  return (
    <div className="min-h-screen text-white pb-24 pt-4 md:pt-10 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                toggleFavorite({
                  id: slug,
                  link: `/hentaiplay/video/${encodeURIComponent(slug)}`,
                  title: data.title,
                  cover_url: data.cover_url,
                  type: "Video",
                  source: "HentaiPlay",
                })
              }
              className={`p-2.5 rounded-full transition-all border ${
                favoriteActive
                  ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/40"
                  : "glass-card border-white/10 text-gray-400 hover:text-rose-400 hover:border-rose-500/40"
              }`}
              title={favoriteActive ? "Hapus dari Favorit" : "Simpan ke Favorit"}
            >
              <Heart size={18} className={favoriteActive ? "fill-white" : ""} />
            </button>

            {data.original_url && (
              <a
                href={data.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full glass-card border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 transition-all"
                title="Buka di Sumber Asli"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Video Player Section */}
        <div className="mb-8">
          <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_0_50px_rgba(244,63,94,0.15)] aspect-video">
            {!isPlaying ? (
              <div
                onClick={() => {
                  if (data.embed_url) {
                    setIsPlaying(true);
                  } else {
                    window.open(data.original_url, "_blank");
                  }
                }}
                className="w-full h-full relative cursor-pointer group"
              >
                {data.cover_url && (
                  <img
                    src={data.cover_url}
                    alt={data.title}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-45 transition-opacity duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/30" />

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-rose-600 blur-xl opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-rose-600/50 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                      <Play size={32} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-white font-bold text-base drop-shadow-md tracking-wide">
                      Klik untuk Memutar
                    </span>
                    <p className="text-rose-300 text-xs mt-1 font-medium">
                      {data.embed_url
                        ? "Streaming Langsung Kualitas HD"
                        : "Buka di HentaiPlay.net"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-black">
                {data.embed_url &&
                (data.embed_url.includes(".mp4") || !data.embed_url.includes("embed")) ? (
                  <video
                    src={`/api/hentaiplay/stream?url=${encodeURIComponent(data.embed_url)}`}
                    poster={data.cover_url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <iframe
                    src={data.embed_url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={12} className="text-rose-400" /> HentaiPlay Premiere
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight font-display">
                {data.title}
              </h1>
            </div>
          </div>

          {data.description && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {data.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {data.tags && filterBlockedTags(data.tags).length > 0 && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                <Tag size={13} className="text-rose-400" /> Kategori & Tag
              </div>
              <div className="flex flex-wrap gap-2">
                {filterBlockedTags(data.tags).map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium glass-card border border-white/10 text-gray-300 hover:text-rose-300 hover:border-rose-500/40 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
