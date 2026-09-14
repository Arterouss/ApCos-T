import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Film, Image, Tag, ExternalLink, Loader2, Play, Share2, X, Heart } from "lucide-react";
import { getPorn3dxDetail } from "../services/porn3dxService";
import { useFavorites } from "../hooks/useFavorites";

export default function Porn3dxDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await getPorn3dxDetail(decodedSlug);
        setData(res);
      } catch (e) {
        setError("Gagal memuat detail. " + (e.response?.data?.error || e.message));
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
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm">
          Kembali
        </button>
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
        {/* Video or Cover */}
        {data?.video_type === "bunny" && data?.video_url ? (
          <div className="rounded-xl overflow-hidden aspect-video bg-black border border-white/10">
            <iframe
              src={data.video_url}
              className="w-full h-full"
              allow="fullscreen"
              allowFullScreen
              title={data.title}
            />
          </div>
        ) : data?.cover_url ? (
          <div className="rounded-xl overflow-hidden max-h-[70vh] flex justify-center bg-black border border-white/10">
            <img
              src={data.cover_url}
              alt={data.title}
              className="max-h-[70vh] object-contain"
            />
          </div>
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
        {data?.tags?.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Tag size={12} /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
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
