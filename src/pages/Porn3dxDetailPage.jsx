import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Image, Tag, ExternalLink, Loader2, Play, Share2, X, Heart, Wrench } from "lucide-react";
import { getPorn3dxDetail } from "../services/porn3dxService";
import { useFavorites } from "../hooks/useFavorites";
import { filterBlockedTags } from "../utils/contentFilter";

export default function Porn3dxDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await getPorn3dxDetail(decodedSlug);
        setData(res);
      } catch (e) {
        setError(e.response?.data?.error || e.message || "Gagal memuat detail.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-violet-400 animate-spin" />
          <p className="text-gray-500 text-sm">Memuat konten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isMaint = error.includes("MAINTENANCE") || error.includes("pemeliharaan") || error.includes("503");
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
        {isMaint ? (
          <div className="max-w-md w-full bg-neutral-900 border border-amber-500/20 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <Wrench size={24} className="animate-pulse" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Server Porn3dx Sedang Maintenance</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Website sumber porn3dx.com saat ini sedang dalam pemeliharaan oleh pengembang aslinya. Detail konten akan dapat diakses kembali setelah maintenance selesai.
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => navigate(-1)} className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-colors">
                Kembali
              </button>
              <button onClick={() => navigate("/rule34video")} className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-lg shadow-violet-600/30">
                Buka Rule34Video (3D)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-red-400 text-sm max-w-md">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold">
              Kembali
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Back Button */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-semibold text-sm text-white line-clamp-1 flex-1">{data?.title || "Detail"}</h1>
        {data?.original_url && (
          <a
            href={data.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 hover:bg-violet-600/20 text-gray-400 hover:text-violet-400 transition-all"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Video Thumbnail + Play */}
        {data?.cover_url && data?.video_url ? (
          !isPlaying ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl overflow-hidden aspect-video bg-black border border-white/10 relative group cursor-pointer"
              onClick={() => setIsPlaying(true)}
            >
              <img
                src={data.cover_url}
                alt={data.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-20 h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/50 group-hover:scale-110 transition-transform duration-300 border border-violet-400/30">
                  <Play size={36} className="text-white ml-1" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-base drop-shadow-lg">Klik untuk Tonton</p>
                  <p className="text-violet-300 text-xs mt-1">Nonton Langsung Disini</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="rounded-xl overflow-hidden aspect-video bg-black border border-white/10 relative">
              {data.video_type === "video" ? (
                <video
                  src={data.video_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  controlsList="nodownload"
                ></video>
              ) : (
                <iframe
                  src={data.video_url}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              )}
            </div>
          )
        ) : data?.cover_url ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl overflow-hidden aspect-video bg-black border border-white/10 relative group cursor-pointer"
            onClick={() => window.open(data.original_url, '_blank')}
          >
            <img
              src={data.cover_url}
              alt={data.title}
              className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity duration-300"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-20 h-20 rounded-full bg-violet-600/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-violet-500/50 group-hover:scale-110 transition-transform duration-300 border border-violet-400/30">
                <ExternalLink size={36} className="text-white ml-1" />
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-base drop-shadow-lg">Buka di Web Asli</p>
                <p className="text-violet-300 text-xs mt-1">Video tidak tersedia untuk di-embed</p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Title & Info */}
        <div className="flex items-start gap-4 justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{data?.title}</h2>
            {data?.description && (
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">{data.description}</p>
            )}
          </div>
          <button
            onClick={() => toggleFavorite({
              id: slug,
              link: `/porn3dx/${encodeURIComponent(slug)}`,
              title: data?.title,
              cover_url: data?.images?.[0] || null,
              type: "3D Porn",
              source: "Porn3dx"
            })}
            className={`p-3 rounded-full flex-shrink-0 transition-all ${
              isFavorite(slug) || isFavorite(`/porn3dx/${encodeURIComponent(slug)}`)
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-violet-400"
            }`}
          >
            <Heart size={24} className={isFavorite(slug) || isFavorite(`/porn3dx/${encodeURIComponent(slug)}`) ? "fill-white" : ""} />
          </button>
        </div>

        {/* Tags */}
        {data?.tags?.length > 0 && filterBlockedTags(data.tags).length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Tag size={12} /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {filterBlockedTags(data.tags).map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/porn3dx?tag=${encodeURIComponent(tag)}`)}
                  className="px-3 py-1 bg-white/5 hover:bg-violet-600/20 text-gray-400 hover:text-violet-300 text-xs rounded-full border border-white/5 hover:border-violet-500/30 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {data?.images?.length > 1 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Image size={12} /> Gallery ({data.images.length} images)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {data.images.map((img, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer rounded-lg overflow-hidden aspect-video bg-gray-900"
                  onClick={() => setSelectedImg(img)}
                >
                  <img
                    src={img}
                    alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImg(null)}
        >
          <img
            src={selectedImg}
            alt="fullscreen"
            className="max-w-full max-h-full object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
            onClick={() => setSelectedImg(null)}
          >
            ✕
          </button>
        </motion.div>
      )}
    </div>
  );
}
