import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Hls from "hls.js";
import { ArrowLeft, Film, Image, Tag, ExternalLink, Loader2, Play, Share2, X, Heart, Wrench, Sparkles } from "lucide-react";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

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

  useEffect(() => {
    if (!isPlaying || !data?.video_url || !videoRef.current) return;

    const streamUrl = `/api/porn3dx/stream?url=${encodeURIComponent(data.video_url)}`;

    if (data.video_type === "m3u8" || data.video_url.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => {});
        });
        return () => hls.destroy();
      } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
        videoRef.current.src = streamUrl;
        videoRef.current.play().catch(() => {});
      }
    } else if (data.video_type === "video") {
      videoRef.current.src = streamUrl;
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying, data?.video_url, data?.video_type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070c] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-3" />
          <p className="text-gray-400 text-xs font-mono">MEMUAT KONTEN 3D...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isMaint = error.includes("MAINTENANCE") || error.includes("pemeliharaan") || error.includes("503");
    return (
      <div className="min-h-screen bg-[#07070c] flex flex-col items-center justify-center p-4">
        {isMaint ? (
          <div
            className="max-w-md w-full rounded-3xl p-8 text-center"
            style={{
              background: 'rgba(18, 18, 28, 0.7)',
              border: '1px solid rgba(251, 191, 36, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4">
              <Wrench size={26} className="animate-pulse" />
            </div>
            <h3 className="font-bold text-white text-base mb-1">Server Porn3dx Sedang Maintenance</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Website sumber porn3dx.com saat ini sedang dalam pemeliharaan. Detail konten akan dapat diakses kembali setelah maintenance selesai.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                Kembali
              </button>
              <button
                onClick={() => navigate("/rule34")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
                }}
              >
                Buka Rule34 (3D)
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8 max-w-md mx-auto text-center"
            style={{
              background: 'rgba(18, 18, 28, 0.6)',
              border: '1px solid rgba(255, 45, 85, 0.25)',
            }}
          >
            <p className="text-neon-red text-sm mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all cursor-pointer"
              style={{ background: '#ff2d55' }}
            >
              Kembali
            </button>
          </div>
        )}
      </div>
    );
  }

  const isFav = isFavorite(slug) || isFavorite(`/porn3dx/${encodeURIComponent(slug)}`);

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#07070c]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-violet-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10">
        {/* Back Button Navbar */}
        <div
          className="sticky top-0 z-30 px-4 py-3.5 flex items-center gap-3 transition-all"
          style={{
            background: 'rgba(7, 7, 12, 0.85)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-semibold text-xs sm:text-sm text-white line-clamp-1 flex-1">
            {data?.title || "Detail Konten 3D"}
          </h1>
          {data?.original_url && (
            <a
              href={data.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-gray-400 hover:text-neon-purple transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
              title="Buka di Website Asli"
            >
              <ExternalLink size={15} />
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
                className="rounded-3xl overflow-hidden aspect-video bg-black relative group cursor-pointer shadow-2xl transition-all duration-300"
                style={{
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(168, 85, 247, 0.15)',
                }}
                onClick={() => setIsPlaying(true)}
              >
                <img
                  src={data.cover_url}
                  alt={data.title}
                  className="w-full h-full object-cover opacity-75 group-hover:opacity-55 transition-opacity duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)',
                    }}
                  >
                    <Play size={28} className="fill-white text-white ml-0.5" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm sm:text-base drop-shadow-lg">Klik untuk Putar Video</p>
                    <p className="text-purple-300 text-xs mt-0.5">Streaming Langsung</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div
                className="rounded-3xl overflow-hidden aspect-video bg-black relative shadow-2xl"
                style={{
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(168, 85, 247, 0.2)',
                }}
              >
                {data.video_type === "bunny" ? (
                  <iframe
                    src={data.video_url}
                    className="w-full h-full border-0"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    poster={data.cover_url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    playsInline
                  />
                )}
              </div>
            )
          ) : data?.cover_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden aspect-video bg-black relative group cursor-pointer shadow-2xl"
              style={{
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={() => window.open(data.original_url, '_blank')}
            >
              <img
                src={data.cover_url}
                alt={data.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-50 transition-opacity duration-300"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)',
                  }}
                >
                  <ExternalLink size={26} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm sm:text-base">Buka di Web Sumber</p>
                  <p className="text-purple-300 text-xs mt-0.5">Video tidak tersedia untuk di-embed</p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* Title & Info */}
          <div className="flex items-start gap-4 justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight tracking-tight">
                {data?.title}
              </h2>
              {data?.description && (
                <p className="text-gray-300 text-xs sm:text-sm mt-2 leading-relaxed">
                  {data.description}
                </p>
              )}
            </div>
            <button
              onClick={() =>
                toggleFavorite({
                  id: slug,
                  link: `/porn3dx/${encodeURIComponent(slug)}`,
                  title: data?.title,
                  cover_url: data?.images?.[0] || data?.cover_url || null,
                  type: "3D Porn",
                  source: "Porn3dx",
                })
              }
              className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isFav ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
              }`}
              style={{
                background: isFav
                  ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isFav
                  ? '1px solid rgba(255, 45, 85, 0.8)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: isFav ? '0 0 20px rgba(255, 45, 85, 0.4)' : 'none',
              }}
            >
              <Heart size={20} className={isFav ? "fill-white" : ""} />
            </button>
          </div>

          {/* Tags */}
          {data?.tags?.length > 0 && filterBlockedTags(data.tags).length > 0 && (
            <div
              className="rounded-3xl p-6"
              style={{
                background: 'rgba(14, 16, 26, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Tag size={13} className="text-neon-purple" />
                <span>Tags Konten</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {filterBlockedTags(data.tags).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => navigate(`/porn3dx`)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
