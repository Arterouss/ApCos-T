import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { getHanimeVideo } from "../services/hanimeTvService";
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
} from "lucide-react";

// ── HLS / MP4 Player ────────────────────────────────────────────────
function VideoPlayer({ videoUrl, referer, quality }) {
  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const [playerError, setPlayerError] = useState(null);
  const [isLoading,   setIsLoading]   = useState(true);

  const getProxyUrl = useCallback((url, ref) => {
    if (!url) return "";
    let finalUrl = url;
    // Add protocol if missing (e.g. streamable.cloud -> https://streamable.cloud)
    if (!finalUrl.startsWith("http")) {
      finalUrl = "https://" + finalUrl;
    }
    
    if (finalUrl.includes(".m3u8")) {
      return `/api/proxy/m3u8?url=${encodeURIComponent(finalUrl)}&referer=${encodeURIComponent(ref || "")}`;
    }
    // Generic proxy for other types (fallback to ts proxy or similar)
    return `/api/proxy/ts?url=${encodeURIComponent(finalUrl)}&referer=${encodeURIComponent(ref || "")}`;
  }, []);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;
    const video = videoRef.current;
    setPlayerError(null);
    setIsLoading(true);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    const isM3U8 = videoUrl.includes(".m3u8");

    if (isM3U8 && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: false,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      hls.loadSource(getProxyUrl(videoUrl, referer));
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
      video.src = getProxyUrl(videoUrl, referer);
      video.addEventListener("loadeddata", () => setIsLoading(false), { once: true });
      video.addEventListener("error", () => {
        setPlayerError("Could not load video."); setIsLoading(false);
      }, { once: true });
      video.play().catch(() => {});
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [videoUrl, referer, getProxyUrl]);

  return (
    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-red-500/10">
      <video ref={videoRef} controls autoPlay playsInline className="w-full h-full object-contain" />
      {isLoading && !playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500 mx-auto mb-2" />
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

export default function HanimeTvDetailPage() {
  const { slug } = useParams();
  const location = useLocation();

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
        console.log("[Hanime] Video Detail Data:", d);
        
        // Extract streams from videos_manifest
        if (d.videos_manifest && d.videos_manifest.servers) {
          console.log("[Hanime] Found manifest servers:", d.videos_manifest.servers.length);
          const allStreams = [];
          d.videos_manifest.servers.forEach(server => {
            if (server.streams) {
              server.streams.forEach(stream => {
                if (stream.url) {
                  allStreams.push({
                    url: stream.url,
                    quality: `${stream.height}p`,
                    referer: "https://hanime.tv/"
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
      <div className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-neutral-950 px-4 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-400" size={48} />
        <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Video</h2>
        <p className="text-gray-400 mb-6 max-w-md">{error || "Post not found."}</p>
        <Link to="/hanimetv" className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
          Back to Gallery
        </Link>
      </div>
    );
  }

  const currentStream = streams[activeQIdx];

  return (
    <div className="min-h-screen text-white pb-24 pt-20 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        <Link to="/hanimetv" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-400 mb-5 transition-colors text-sm">
          <ArrowLeft size={18} /> Back to Hanime.tv
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-rose-500 bg-clip-text text-transparent leading-tight">
          {data.name}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-5">
          {data.views != null && <span className="flex items-center gap-1.5"><Eye size={14} className="text-blue-400"/>{Number(data.views).toLocaleString()} views</span>}
          {data.brand && <span className="flex items-center gap-1.5"><Tag size={14} className="text-purple-400"/>{data.brand}</span>}
          {data.released_at && <span className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-500"/>{new Date(data.released_at).toLocaleDateString()}</span>}
        </div>

        <div className="mb-8">
          {!playerVisible ? (
            <div
              className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-red-500/10 bg-black group cursor-pointer"
              onClick={handlePlay}
            >
              {(data.poster_url || data.cover_url) && (
                <img src={data.poster_url || data.cover_url} alt={data.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-red-600/90 hover:bg-red-500 p-5 rounded-full shadow-2xl shadow-red-500/40 transition-all group-hover:scale-110 duration-200">
                  <Play size={40} className="fill-white text-white" />
                </div>
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-gray-300 text-sm">
                Click to play
              </p>
            </div>
          ) : (
            <div>
              {streams.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {streams.map((s, idx) => (
                    <button key={idx} onClick={() => setActiveQIdx(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border
                        ${activeQIdx === idx
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-red-500/20 hover:border-red-500/40"}`}>
                      {s.quality}
                    </button>
                  ))}
                </div>
              )}

              {currentStream ? (
                <VideoPlayer key={activeQIdx} videoUrl={currentStream.url} referer={currentStream.referer} quality={currentStream.quality} />
              ) : (
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 flex flex-col items-center justify-center gap-4 relative">
                  {(data.poster_url || data.cover_url) && <img src={data.poster_url || data.cover_url} alt={data.name} className="absolute inset-0 w-full h-full object-cover opacity-20" />}
                  <div className="relative z-10 text-center px-6">
                    <AlertTriangle size={36} className="mx-auto mb-3 text-amber-400" />
                    <p className="text-gray-400 text-sm mb-4">Stream unavailable.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {data.description && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
            <div className="text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: data.description }} />
          </div>
        )}

        {data.hentai_tags && data.hentai_tags.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag size={13}/> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.hentai_tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:border-red-500/40 hover:text-red-300 transition-colors cursor-default">
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
