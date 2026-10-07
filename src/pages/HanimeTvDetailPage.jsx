import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getHanimeVideo } from "../services/hanimeTvService";
import Hls from "hls.js";
import { filterBlockedTags } from "../utils/contentFilter";
import {
  ArrowLeft,
  ExternalLink,
  Play,
  AlertTriangle,
  Eye,
  Heart,
  Calendar,
  Tag,
  Loader,
  Sparkles,
} from "lucide-react";

// ── HLS / MP4 Player ────────────────────────────────────────────────
function VideoPlayer({ videoUrl, referer, quality }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playerError, setPlayerError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildProxyUrl = useCallback((url, referer) => {
    if (!url) return "";
    let abs = url;
    if (!abs.startsWith("http")) {
      abs = "https://" + abs;
    }
    return `/api/proxy?url=${encodeURIComponent(abs)}&referer=${encodeURIComponent(referer || "")}`;
  }, []);

  const isIframe = videoUrl && !videoUrl.includes(".m3u8") && !videoUrl.includes(".mp4");

  useEffect(() => {
    if (isIframe || !videoUrl || !videoRef.current) return;
    const video = videoRef.current;
    setPlayerError(null);
    setIsLoading(true);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const isM3U8 = videoUrl.includes(".m3u8");

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
        setIsLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else if (d.type === Hls.ErrorTypes.NETWORK_ERROR) setTimeout(() => hls.startLoad(), 2000);
          else { setPlayerError("Pemutaran gagal. Video mungkin dibatasi di wilayah Anda."); setIsLoading(false); hls.destroy(); }
        }
      });
      hlsRef.current = hls;
    } else {
      video.src = buildProxyUrl(videoUrl, referer);
      video.addEventListener("loadeddata", () => setIsLoading(false), { once: true });
      video.addEventListener("error", () => {
        setPlayerError("Tidak dapat memuat video."); setIsLoading(false);
      }, { once: true });
      video.play().catch(() => {});
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [videoUrl, referer, buildProxyUrl, isIframe]);

  if (isIframe) {
    const embedProxyUrl = videoUrl.startsWith("http")
      ? `/api/embed?url=${encodeURIComponent(videoUrl)}`
      : videoUrl;
    return (
      <div
        className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: '#050508',
          border: '1px solid rgba(255, 45, 85, 0.25)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(255, 45, 85, 0.12)',
        }}
      >
        <iframe
          src={embedProxyUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl"
      style={{
        background: '#050508',
        border: '1px solid rgba(255, 45, 85, 0.25)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(255, 45, 85, 0.12)',
      }}
    >
      <video ref={videoRef} controls autoPlay playsInline className="w-full h-full object-contain" />
      {isLoading && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500 mx-auto mb-2" />
            <p className="text-gray-400 text-xs font-mono">{quality} sedang dimuat…</p>
          </div>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm">
          <div className="text-center p-6 max-w-sm">
            <AlertTriangle className="mx-auto mb-3 text-neon-red" size={36} />
            <p className="text-gray-300 text-xs sm:text-sm mb-4 leading-relaxed">{playerError}</p>
            <a
              href={`https://hanime.tv/hentai-videos/${videoUrl.split('/').pop().replace('.m3u8', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #ff2d55, #ff6b35)' }}
            >
              <ExternalLink size={12} /> Buka di Situs Asli
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HanimeTvDetailPage() {
  const { slug } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [streams, setStreams] = useState([]);
  const [activeQIdx, setActiveQIdx] = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    getHanimeVideo(slug)
      .then((d) => {
        setData(d.hentai_video || d);
        if (d.videos_manifest && d.videos_manifest.servers) {
          const allStreams = [];
          d.videos_manifest.servers.forEach(server => {
            if (server.streams) {
              server.streams.forEach(stream => {
                if (stream.url) {
                  allStreams.push({
                    url: stream.url,
                    quality: stream.quality || `${stream.height || 1080}p`,
                    referer: stream.referer || "https://jav.guru/"
                  });
                }
              });
            }
          });
          setStreams(allStreams);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePlay = () => {
    setPlayerVisible(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#07070b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mx-auto mb-3" />
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
            to="/hanimetv"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all inline-block"
            style={{ background: '#ff2d55' }}
          >
            Kembali ke Jav.Guru
          </Link>
        </div>
      </div>
    );
  }

  const currentStream = streams[activeQIdx];

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-8 px-4 md:px-8 relative overflow-hidden bg-[#07070b]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-rose-600/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-600/[0.04] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <Link
          to="/hanimetv"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white mb-6 transition-all"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Jav.Guru</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-display font-black mb-3 leading-tight tracking-tight text-white">
          {data.name}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-6">
          {data.views != null && (
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <Eye size={13} className="text-neon-cyan"/>
              <span>{Number(data.views).toLocaleString()} views</span>
            </span>
          )}
          {data.brand && (
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <Tag size={13} className="text-neon-purple"/>
              <span>{data.brand}</span>
            </span>
          )}
          {data.released_at && (
            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
            >
              <Calendar size={13} className="text-gray-400"/>
              <span>{new Date(data.released_at).toLocaleDateString()}</span>
            </span>
          )}
        </div>

        {/* Video Player Section */}
        <div className="mb-8">
          {!playerVisible ? (
            <div
              className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black group cursor-pointer transition-all duration-300"
              style={{
                border: '1px solid rgba(255, 45, 85, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 45, 85, 0.15)',
              }}
              onClick={handlePlay}
            >
              {(data.poster_url || data.cover_url) && (
                <img
                  src={data.poster_url || data.cover_url}
                  alt={data.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const u = data.poster_url || data.cover_url;
                    if (!e.target.dataset.proxied && u && u.startsWith("http")) {
                      e.target.dataset.proxied = "true";
                      e.target.src = `/api/proxy?url=${encodeURIComponent(u)}&referer=https://jav.guru/`;
                    }
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-110 duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #ff2d55, #ff6b35)',
                    boxShadow: '0 0 30px rgba(255, 45, 85, 0.6)',
                  }}
                >
                  <Play size={28} className="fill-white text-white ml-0.5" />
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-gray-300 text-xs sm:text-sm font-semibold tracking-wide drop-shadow">
                Klik untuk Putar Video
              </p>
            </div>
          ) : (
            <div>
              {streams.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {streams.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveQIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        activeQIdx === idx
                          ? "text-white shadow-lg"
                          : "text-gray-400 hover:text-white"
                      }`}
                      style={{
                        background: activeQIdx === idx
                          ? 'linear-gradient(135deg, #ff2d55, #ff6b35)'
                          : 'rgba(255, 255, 255, 0.04)',
                        border: activeQIdx === idx
                          ? '1px solid rgba(255, 45, 85, 0.7)'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: activeQIdx === idx ? '0 0 15px rgba(255, 45, 85, 0.35)' : 'none',
                      }}
                    >
                      {s.quality}
                    </button>
                  ))}
                </div>
              )}

              {currentStream ? (
                <VideoPlayer key={activeQIdx} videoUrl={currentStream.url} referer={currentStream.referer} quality={currentStream.quality} />
              ) : (
                <div
                  className="aspect-video rounded-3xl overflow-hidden flex flex-col items-center justify-center gap-4 relative"
                  style={{
                    background: 'rgba(14, 16, 26, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div className="relative z-10 text-center px-6">
                    <AlertTriangle size={36} className="mx-auto mb-3 text-amber-400" />
                    <p className="text-gray-400 text-sm">Stream saat ini tidak tersedia.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {data.description && (
          <div
            className="rounded-3xl p-6 mb-6"
            style={{
              background: 'rgba(14, 16, 26, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h2 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Deskripsi</h2>
            <div className="text-xs sm:text-sm text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: data.description }} />
          </div>
        )}

        {data.hentai_tags && filterBlockedTags(data.hentai_tags).length > 0 && (
          <div
            className="rounded-3xl p-6"
            style={{
              background: 'rgba(14, 16, 26, 0.6)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Tag size={13} className="text-neon-red" />
              <span>Tags Video</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {filterBlockedTags(data.hentai_tags).map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl text-xs text-gray-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {tag.text}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
