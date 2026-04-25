import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getOreno3dDetail } from "../services/oreno3dService";
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
  ChevronDown,
} from "lucide-react";

export default function Oreno3dDetailPage() {
  const { slug } = useParams();
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [videoError,   setVideoError]   = useState(null);
  const [activeQIdx,   setActiveQIdx]   = useState(0);

  const videoRef = useRef(null);
  const hlsRef   = useRef(null);

  // ── Load detail ─────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      setVideoError(null);
      try {
        const detail = await getOreno3dDetail(slug);
        setData(detail);
        setActiveQIdx(0);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  // ── Helper: build proxy URL (same as CavPorn) ────────────────────
  const buildProxyUrl = useCallback((url, referer) => {
    return `/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer || "")}`;
  }, []);

  // ── Init HLS/MP4 player (same pattern as CavPorn) ────────────────
  useEffect(() => {
    if (!data?.rawVideoUrls?.length || !videoRef.current) return;

    const video    = videoRef.current;
    const stream   = data.rawVideoUrls[activeQIdx];
    const videoUrl = stream.url;
    const referer  = stream.referer || "https://www.iwara.tv/";
    const isM3U8   = videoUrl.includes(".m3u8");

    setVideoError(null);

    // Cleanup previous HLS
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (isM3U8 && Hls.isSupported()) {
      console.log("[Oreno3D HLS] Init:", videoUrl);
      const hls = new Hls({
        xhrSetup: (xhr, xhrUrl) => {
          let finalUrl = xhrUrl;
          if (xhrUrl.includes("/api/proxy")) {
            if (xhrUrl.startsWith("http")) {
              try { const u = new URL(xhrUrl); finalUrl = u.pathname + u.search; } catch {}
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
        console.log("[Oreno3D HLS] Ready");
        video.play().catch((e) => console.log("[Oreno3D] Autoplay blocked:", e));
      });
      hls.on(Hls.Events.ERROR, (_, d) => {
        console.error("[Oreno3D HLS] Error:", d.type, d.details);
        if (d.fatal) {
          if (d.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else if (d.type === Hls.ErrorTypes.NETWORK_ERROR) setTimeout(() => hls.startLoad(), 2000);
          else { setVideoError("Video playback failed. Please try another quality."); hls.destroy(); }
        }
      });
      hlsRef.current = hls;

    } else if (isM3U8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = buildProxyUrl(videoUrl, referer);
      video.play().catch(() => {});

    } else {
      // Direct MP4 — Iwara CDN is publicly accessible, try direct first
      video.src = videoUrl;
      video.addEventListener("error", () => {
        // Fallback to proxy if direct fails
        video.src = buildProxyUrl(videoUrl, referer);
        video.play().catch(() => {});
      }, { once: true });
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, [data, activeQIdx, buildProxyUrl]);

  // ── Quality switch ───────────────────────────────────────────────
  const switchQuality = (idx) => {
    if (idx === activeQIdx) return;
    setActiveQIdx(idx);
    // useEffect above will re-init the player
  };

  // ── Loading & error states ───────────────────────────────────────
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

  const hasVideo = data.rawVideoUrls && data.rawVideoUrls.length > 0;

  return (
    <div className="min-h-screen text-white pb-24 pt-20 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-5xl mx-auto">

        {/* ── Back link ─────────────────────────────────────────── */}
        <Link to="/oreno3d" className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 mb-5 transition-colors text-sm">
          <ArrowLeft size={18} /> Back to Gallery
        </Link>

        {/* ── Title ─────────────────────────────────────────────── */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
          {data.title}
        </h1>

        {/* ── Meta ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
          {data.author && <span className="flex items-center gap-1.5"><User size={14} className="text-cyan-500" />{data.author}</span>}
          {data.views  && <span className="flex items-center gap-1.5"><Eye  size={14} className="text-blue-400" />{Number(data.views).toLocaleString()} views</span>}
          {data.likes  && <span className="flex items-center gap-1.5"><Heart size={14} className="text-pink-400" />{Number(data.likes).toLocaleString()} likes</span>}
          {data.date   && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500" />{data.date}</span>}
        </div>

        {/* ── Video Player ──────────────────────────────────────── */}
        <div className="mb-6">
          {/* Quality tabs */}
          {hasVideo && data.rawVideoUrls.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {data.rawVideoUrls.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => switchQuality(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border
                    ${activeQIdx === idx
                      ? "bg-cyan-500 text-black border-cyan-500"
                      : "bg-white/5 border-white/10 text-gray-300 hover:bg-cyan-500/20 hover:border-cyan-500/40"
                    }`}
                >
                  {s.quality || `Stream ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Player box — identical pattern to CavPorn */}
          <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10 bg-black relative">
            {hasVideo ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  poster={data.thumbnail || undefined}
                />
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center p-6">
                      <AlertTriangle className="mx-auto mb-3 text-red-400" size={36} />
                      <p className="text-gray-300 text-sm mb-4">{videoError}</p>
                      <a
                        href={data.externalVideoUrl || data.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-full text-sm font-medium transition-colors"
                      >
                        <ExternalLink size={14} /> Watch on Iwara
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* No stream extracted — show thumbnail + external button */
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                {data.thumbnail && (
                  <img src={data.thumbnail} alt={data.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <div className="relative z-10 text-center">
                  <p className="text-gray-400 mb-4 text-sm">Stream could not be extracted automatically.</p>
                  <a
                    href={data.externalVideoUrl || data.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full transition-all shadow-lg shadow-cyan-500/30 hover:scale-105"
                  >
                    <Play size={18} className="fill-black" /> Watch on Iwara
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Source link below player */}
          <div className="flex justify-end mt-2">
            <a
              href={data.externalVideoUrl || data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-cyan-400 flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={11} /> Source
            </a>
          </div>
        </div>

        {/* ── Tags ──────────────────────────────────────────────── */}
        {data.tags && data.tags.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag size={13} /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors cursor-default"
                >
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
