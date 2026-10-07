import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getCavPornDetail } from "../services/cavpornService";
import Hls from "hls.js";
import { useFavorites } from "../hooks/useFavorites";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Play,
  AlertTriangle,
  Tag,
  Clock,
  ThumbsUp,
  Share2,
  ListVideo,
  Info,
  Heart,
  Sparkles,
} from "lucide-react";

export default function CavPornDetailPage() {
  const { id, slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCavPornDetail(id, slug);
        setData(detail);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadDetail();
  }, [id, slug]);

  const buildProxyUrl = useCallback((url, referer) => {
    let abs = url;
    if (!url.startsWith("http")) {
      abs = url;
    }
    return `/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer || "")}`;
  }, []);

  useEffect(() => {
    if (!data?.rawVideoSrc || !videoRef.current) return;

    const video = videoRef.current;
    const videoUrl = data.rawVideoSrc;
    const referer = data.originalUrl || "";
    const isM3U8 = videoUrl.includes(".m3u8");

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, xhrUrl) => {
          let finalUrl = xhrUrl;
          if (xhrUrl.includes("/api/proxy")) {
            if (xhrUrl.startsWith("http")) {
              try {
                const u = new URL(xhrUrl);
                finalUrl = u.pathname + u.search;
              } catch {
                finalUrl = xhrUrl;
              }
            }
          } else {
            finalUrl = buildProxyUrl(xhrUrl, referer);
          }
          xhr.open("GET", finalUrl, true);
        },
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 90,
      });

      hls.loadSource(buildProxyUrl(videoUrl, referer));
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setVideoError(null);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else if (d.type === Hls.ErrorTypes.NETWORK_ERROR) setTimeout(() => hls.startLoad(), 2000);
          else {
            setVideoError("Gagal memuat video stream HLS.");
            hls.destroy();
          }
        }
      });

      hlsRef.current = hls;
    } else {
      video.src = buildProxyUrl(videoUrl, referer);
      video.addEventListener("error", () => {
        setVideoError("Gagal memuat video.");
      });
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [data, buildProxyUrl]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#07070b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400 mx-auto mb-3" />
          <p className="text-gray-400 text-xs font-mono">MEMUAT DETAIL VIDEO...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-[#07070b] px-4 text-center">
        <div
          className="rounded-3xl p-8 max-w-md mx-auto"
          style={{
            background: 'rgba(18, 18, 28, 0.6)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
          }}
        >
          <AlertTriangle className="mx-auto mb-3 text-neon-red" size={44} />
          <h2 className="text-lg font-bold mb-2 text-white">Gagal Memuat Video</h2>
          <p className="text-gray-400 text-xs mb-6">{error || "Data video tidak ditemukan."}</p>
          <Link
            to="/cavporn"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all inline-block"
            style={{ background: '#00e5ff' }}
          >
            Kembali ke CavPorn
          </Link>
        </div>
      </div>
    );
  }

  const isFav = isFavorite(id);

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-8 px-4 md:px-8 relative overflow-hidden bg-[#07070b]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/[0.05] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <Link
          to="/cavporn"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white mb-6 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke CavPorn</span>
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-black leading-tight tracking-tight text-white flex-1">
            {data.title}
          </h1>
          <button
            onClick={() =>
              toggleFavorite({
                id: id,
                link: `/cavporn/${id}/${slug || ''}`,
                title: data.title,
                cover_url: data.thumbnail || null,
                type: "JAV",
                source: "CavPorn",
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

        {/* Video Player Section */}
        <div className="mb-8">
          <div
            className="aspect-video rounded-3xl overflow-hidden shadow-2xl relative"
            style={{
              background: '#040508',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 229, 255, 0.12)',
            }}
          >
            {data.rawVideoSrc ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  poster={data.thumbnail}
                />
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm">
                    <div className="text-center p-6 max-w-sm">
                      <AlertTriangle className="mx-auto mb-3 text-neon-red" size={36} />
                      <p className="text-gray-300 text-xs sm:text-sm mb-4 leading-relaxed">{videoError}</p>
                      <a
                        href={data.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #ff2d55, #ff6b35)' }}
                      >
                        <ExternalLink size={12} /> Buka di Situs Asli
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <p className="text-gray-400 text-sm mb-4">Stream video tidak dapat diekstrak langsung.</p>
                  <a
                    href={data.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-black"
                    style={{ background: '#00e5ff' }}
                  >
                    <ExternalLink size={14} /> Tonton di Situs Sumber
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {data.category && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(14, 16, 26, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5">Kategori</h3>
              <span className="text-sm font-semibold text-white">{data.category}</span>
            </div>
          )}

          {data.downloadUrl && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(14, 16, 26, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Download size={13} className="text-neon-cyan" /> Download
              </h3>
              <a
                href={data.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neon-cyan hover:underline mt-1"
              >
                <Download size={12} /> Unduh Video MP4
              </a>
            </div>
          )}

          {data.originalUrl && (
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(14, 16, 26, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 mb-1.5">Sumber Asli</h3>
              <a
                href={data.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-neon-cyan text-xs font-mono flex items-center gap-1 mt-1 transition-colors"
              >
                <ExternalLink size={12} /> cav103.com
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
