import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getOreno3dDetail, getOreno3dStream } from "../services/oreno3dService";
import Hls from "hls.js";
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
  Download,
  User,
} from "lucide-react";

// ── HLS / MP4 Player ────────────────────────────────────────────────
function VideoPlayer({ videoUrl, referer, quality }) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const [playerError, setPlayerError] = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);

  const proxyUrl = useCallback(
    (url, ref) => `/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(ref || "")}`,
    []
  );

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;
    const video = videoRef.current;
    setPlayerError(null);
    setIsLoading(true);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const isM3U8 = videoUrl.includes(".m3u8");

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr, xhrUrl) => {
          let finalUrl = xhrUrl;
          if (!xhrUrl.includes("/api/proxy")) {
            finalUrl = proxyUrl(xhrUrl, referer);
          } else if (xhrUrl.startsWith("http")) {
            try { const u = new URL(xhrUrl); finalUrl = u.pathname + u.search; } catch {}
          }
          xhr.open("GET", finalUrl, true);
        },
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hls.loadSource(proxyUrl(videoUrl, referer));
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else if (d.type === Hls.ErrorTypes.NETWORK_ERROR) setTimeout(() => hls.startLoad(), 2000);
          else { setPlayerError("Playback failed."); setIsLoading(false); hls.destroy(); }
        }
      });
      hlsRef.current = hls;
    } else {
      // Direct MP4 — try direct first, fallback to proxy
      video.src = videoUrl;
      video.addEventListener("loadeddata", () => setIsLoading(false), { once: true });
      video.addEventListener("error", () => {
        video.src = proxyUrl(videoUrl, referer);
        video.addEventListener("loadeddata", () => setIsLoading(false), { once: true });
        video.addEventListener("error", () => { setPlayerError("Could not load video."); setIsLoading(false); }, { once: true });
      }, { once: true });
      video.play().catch(() => {});
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [videoUrl, referer, proxyUrl]);

  return (
    <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
      <video ref={videoRef} controls autoPlay playsInline className="w-full h-full object-contain" />
      {isLoading && !playerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-3" />
          <p className="text-gray-300 text-sm font-medium mb-1">Memuat stream ({quality})...</p>
          <p className="text-gray-500 text-xs text-center max-w-xs">Jika Iwara sibuk / memblokir proxy, silakan putar melalui link di bawah.</p>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 p-6 text-center z-20">
          <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3">
            <AlertTriangle className="text-red-400" size={24} />
          </div>
          <h4 className="text-base font-bold text-white mb-1">Gagal Memutar Video MP4</h4>
          <p className="text-gray-400 text-xs mb-5 max-w-md">
            Server CDN Iwara menolak pemutaran di dalam pemutar web (proteksi Cloudflare/token kedaluwarsa).
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
            >
              <Download size={14} /> Download MP4 Langsung
            </a>
            <a
              href={`https://www.iwara.tv/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 hover:scale-105"
            >
              <Play size={14} className="fill-black" /> Buka di Iwara TV
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function Oreno3dDetailPage() {
  const { slug } = useParams();
  const location = useLocation();

  // Data from gallery link state (fast, no extra fetch needed)
  // or fallback to API fetch if navigated directly
  const [data,    setData]    = useState(location.state?.videoData || null);
  const [loading, setLoading] = useState(!location.state?.videoData);
  const [error,   setError]   = useState(null);

  // Phase 2: on-demand stream
  const [streams,       setStreams]       = useState([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError,   setStreamError]   = useState(null);
  const [activeQIdx,    setActiveQIdx]    = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);

  // ── Load metadata only if not passed from gallery ─────────────
  useEffect(() => {
    if (data) return; // already have data from Link state
    if (!slug) return;
    setLoading(true);
    setError(null);
    getOreno3dDetail(slug)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch stream on play click ────────────────────────────────
  const handlePlay = async () => {
    if (streams.length > 0) { setPlayerVisible(true); return; }

    const iwaraId = data?.iwaraVideoId || data?.iwaraId || data?.id || slug;
    if (!iwaraId) {
      setStreamError("No video ID found.");
      setPlayerVisible(true);
      return;
    }

    setStreamLoading(true);
    setStreamError(null);
    try {
      const result = await getOreno3dStream(iwaraId);
      if (result.debug) console.log("Stream debug info:", result.debug);
      if (result.error) {
        setStreamError("Backend Error: " + result.error);
      } else if (!result.rawVideoUrls || result.rawVideoUrls.length === 0) {
        setStreamError("No video sources found.");
      } else {
        setStreams(result.rawVideoUrls);
        setActiveQIdx(0);
      }
    } catch (e) {
      setStreamError("Could not load stream.");
    } finally {
      setStreamLoading(false);
      setPlayerVisible(true);
    }
  };

  // ── Loading & error ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-neutral-950 px-4 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
        <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Video</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error || "Post not found."}</p>
        <Link to="/oreno3d" className="px-6 py-2 bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors">
          Back to Gallery
        </Link>
      </div>
    );
  }

  const currentStream = streams[activeQIdx];

  return (
    <div className="min-h-screen text-white pb-24 pt-20 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link to="/oreno3d" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-5 transition-colors text-sm">
          <ArrowLeft size={18} /> Back to Gallery
        </Link>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
          {data.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
          {data.author && <span className="flex items-center gap-1.5"><User size={14} className="text-cyan-500"/>{data.author}</span>}
          {data.views  != null && <span className="flex items-center gap-1.5"><Eye  size={14} className="text-blue-400"/>{Number(data.views).toLocaleString()} views</span>}
          {data.likes  != null && <span className="flex items-center gap-1.5"><Heart size={14} className="text-pink-400"/>{Number(data.likes).toLocaleString()} likes</span>}
          {data.date   && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500"/>{data.date}</span>}
        </div>

        {/* ── Video section ─────────────────────────────────────────── */}
        <div className="mb-8">

          {!playerVisible ? (
            /* Thumbnail + Play button */
            <div
              className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10 bg-black group cursor-pointer"
              onClick={handlePlay}
            >
              {data.thumbnail && (
                <img src={data.thumbnail} alt={data.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                {streamLoading ? (
                  <div className="bg-black/60 p-5 rounded-full">
                    <Loader size={40} className="text-cyan-400 animate-spin" />
                  </div>
                ) : (
                  <div className="bg-cyan-500/90 hover:bg-cyan-400 p-5 rounded-full shadow-2xl shadow-cyan-500/40 transition-all group-hover:scale-110 duration-200">
                    <Play size={40} className="fill-black text-black" />
                  </div>
                )}
              </div>
              {!streamLoading && (
                <p className="absolute bottom-4 left-0 right-0 text-center text-gray-300 text-sm">
                  Click to play
                </p>
              )}
            </div>
          ) : (
            /* Player */
            <div>
              {/* Quality tabs and Download action */}
              {streams.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap gap-2">
                    {streams.map((s, idx) => (
                      <button key={idx} onClick={() => setActiveQIdx(idx)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border
                          ${activeQIdx === idx
                            ? "bg-cyan-500 text-black border-cyan-500"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-cyan-500/20 hover:border-cyan-500/40"}`}>
                        {s.quality}
                      </button>
                    ))}
                  </div>
                  {currentStream && (
                    <a
                      href={currentStream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={`${data.title || "video"}.mp4`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold rounded-lg text-xs transition-all shadow-lg shadow-emerald-500/20 hover:scale-105"
                    >
                      <Download size={14} /> Download MP4 ({currentStream.quality})
                    </a>
                  )}
                </div>
              )}

              {currentStream ? (
                <VideoPlayer key={activeQIdx} videoUrl={currentStream.url} referer={currentStream.referer} quality={currentStream.quality} />
              ) : (
                /* Fallback: Cloudflare protected or stream unavailable */
                <div className="aspect-video rounded-2xl overflow-hidden border border-cyan-500/30 bg-neutral-900/90 flex flex-col items-center justify-center p-6 text-center relative shadow-2xl shadow-cyan-500/10">
                  {data.thumbnail && <img src={data.thumbnail} alt={data.title} className="absolute inset-0 w-full h-full object-cover opacity-15 blur-sm pointer-events-none" />}
                  <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                      <AlertTriangle size={28} className="text-cyan-400" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                      Dilindungi Keamanan Cloudflare Iwara
                    </h3>
                    <p className="text-gray-300 text-xs md:text-sm mb-6 leading-relaxed">
                      Situs Iwara saat ini mengaktifkan proteksi <span className="text-cyan-400 font-semibold">Cloudflare Anti-Bot (Turnstile)</span> sehingga server proxy tidak dapat menarik link streaming MP4 secara otomatis.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                      <a
                        href={data.externalVideoUrl || data.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-extrabold rounded-xl transition-all shadow-xl shadow-cyan-500/30 hover:scale-105 text-sm"
                      >
                        <Play size={18} className="fill-black" /> Putar & Download Langsung di Iwara
                      </a>
                      <button
                        onClick={handlePlay}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/15 transition-all text-sm"
                      >
                        <Loader size={16} /> Coba Muat Ulang
                      </button>
                    </div>
                    <p className="text-gray-400 text-[11px] mt-4">
                      💡 <span className="text-gray-300 font-medium">Tips:</span> Saat halaman Iwara terbuka di tab baru, Anda bisa langsung menonton tanpa iklan atau menggunakan ekstensi download Anda!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source link & Download button */}
          <div className="flex justify-between items-center mt-3">
            {currentStream ? (
              <a
                href={currentStream.url}
                target="_blank"
                rel="noopener noreferrer"
                download={`${data.title || "video"}.mp4`}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
              >
                <Download size={13} /> Direct Download Link
              </a>
            ) : <div />}
            <a href={data.externalVideoUrl || data.originalUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-cyan-400 flex items-center gap-1 transition-colors">
              <ExternalLink size={11} /> Source
            </a>
          </div>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag size={13}/> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
