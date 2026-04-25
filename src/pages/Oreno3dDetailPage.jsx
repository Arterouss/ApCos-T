import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
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
  User,
  Tag,
  Loader,
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
      // Direct MP4 — Iwara CDN is public, try direct first
      video.src = videoUrl;
      const onLoad = () => setIsLoading(false);
      video.addEventListener("loadeddata", onLoad, { once: true });
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
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10">
      <video ref={videoRef} controls autoPlay playsInline className="w-full h-full object-contain" />
      {isLoading && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">{quality} loading…</p>
          </div>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-4">
            <AlertTriangle className="mx-auto mb-2 text-red-400" size={32} />
            <p className="text-gray-300 text-sm">{playerError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function Oreno3dDetailPage() {
  const { slug } = useParams();

  // Phase 1: fast metadata
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Phase 2: on-demand stream
  const [streams,       setStreams]       = useState([]);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError,   setStreamError]   = useState(null);
  const [activeQIdx,    setActiveQIdx]    = useState(0);
  const [playerVisible, setPlayerVisible] = useState(false);

  // ── Load metadata ────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setStreams([]);
    setPlayerVisible(false);
    getOreno3dDetail(slug)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Fetch stream on play click ────────────────────────────────────
  const handlePlay = async () => {
    if (streams.length > 0) { setPlayerVisible(true); return; }
    if (!data?.iwaraVideoId) { setPlayerVisible(true); return; } // will show fallback

    setStreamLoading(true);
    setStreamError(null);
    try {
      const result = await getOreno3dStream(data.iwaraVideoId);
      setStreams(result.rawVideoUrls || []);
      setActiveQIdx(0);
    } catch (e) {
      setStreamError("Could not load stream.");
    } finally {
      setStreamLoading(false);
      setPlayerVisible(true);
    }
  };

  // ── Loading & error ───────────────────────────────────────────────
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
          {data.views  && <span className="flex items-center gap-1.5"><Eye  size={14} className="text-blue-400"/>{Number(data.views).toLocaleString()} views</span>}
          {data.likes  && <span className="flex items-center gap-1.5"><Heart size={14} className="text-pink-400"/>{Number(data.likes).toLocaleString()} likes</span>}
          {data.date   && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500"/>{data.date}</span>}
        </div>

        {/* ── Video section ─────────────────────────────────────────── */}
        <div className="mb-8">

          {!playerVisible ? (
            /* Thumbnail + Play button */
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10 bg-black group cursor-pointer" onClick={handlePlay}>
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
              {/* Quality tabs */}
              {streams.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
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
              )}

              {currentStream ? (
                <VideoPlayer key={activeQIdx} videoUrl={currentStream.url} referer={currentStream.referer} quality={currentStream.quality} />
              ) : (
                /* Fallback: no stream extracted */
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex flex-col items-center justify-center gap-4 relative">
                  {data.thumbnail && <img src={data.thumbnail} alt={data.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                  <div className="relative z-10 text-center px-6">
                    <AlertTriangle size={36} className="mx-auto mb-3 text-amber-400" />
                    <p className="text-gray-400 text-sm mb-4">{streamError || "Stream unavailable. Watch on the original site."}</p>
                    <a href={data.externalVideoUrl || data.originalUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-lg shadow-cyan-500/30 hover:scale-105">
                      <Play size={18} className="fill-black" /> Watch on Iwara
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source link */}
          <div className="flex justify-end mt-2">
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
