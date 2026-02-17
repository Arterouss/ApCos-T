import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getNekopoiDetail } from "../services/nekopoiService";
import Hls from "hls.js";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Play,
  AlertTriangle,
} from "lucide-react";

// Individual HLS Video Player component
function HlsVideoPlayer({ videoUrl, referer, title, index }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playerError, setPlayerError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const buildProxyUrl = useCallback((url, ref) => {
    return `/api/proxy?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(ref || "")}`;
  }, []);

  useEffect(() => {
    if (!videoUrl || !videoRef.current) return;

    const video = videoRef.current;
    const isM3U8 = videoUrl.includes(".m3u8");

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isM3U8 && Hls.isSupported()) {
      console.log(`[Nekopoi HLS ${index}] Initializing:`, videoUrl);

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
        console.log(`[Nekopoi HLS ${index}] Manifest parsed, ready to play`);
        setIsLoading(false);
        video.play().catch((e) => console.log("Autoplay blocked:", e));
      });

      hls.on(Hls.Events.ERROR, (_, hlsData) => {
        console.error(
          `[Nekopoi HLS ${index}] Error:`,
          hlsData.type,
          hlsData.details,
        );
        if (hlsData.fatal) {
          if (hlsData.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else if (hlsData.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => hls.startLoad(), 2000);
          } else {
            setPlayerError("Video playback failed.");
            setIsLoading(false);
            hls.destroy();
          }
        }
      });

      hlsRef.current = hls;
    } else if (isM3U8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = buildProxyUrl(videoUrl, referer);
      video.addEventListener("loadeddata", () => setIsLoading(false));
      video.play().catch(() => {});
    } else {
      // Direct MP4
      video.src = buildProxyUrl(videoUrl, referer);
      video.addEventListener("loadeddata", () => setIsLoading(false));
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, referer, index, buildProxyUrl]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        controls
        playsInline
        className="w-full h-full object-contain"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mx-auto mb-2"></div>
            <p className="text-gray-300 text-sm">Loading video...</p>
          </div>
        </div>
      )}
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-4">
            <AlertTriangle className="mx-auto mb-2 text-yellow-500" size={32} />
            <p className="text-gray-300 text-sm">{playerError}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NekopoiDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("hls"); // "hls" or "iframe"
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getNekopoiDetail(slug);
        setData(detail);
        // Auto-select tab: prefer HLS if raw URLs available
        if (detail.rawVideoUrls && detail.rawVideoUrls.length > 0) {
          setActiveTab("hls");
          setSelectedStreamIndex(0);
        } else if (detail.videoIframes && detail.videoIframes.length > 0) {
          setActiveTab("iframe");
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-neutral-950 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          <AlertTriangle className="mx-auto mb-2" size={48} />
          Error Loading Post
        </h2>
        <p className="text-gray-400 mb-6 max-w-md">
          {error || "The requested post could not be found."}
        </p>
        <Link
          to="/nekopoi"
          className="px-6 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors text-white"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  const hasHlsVideos = data.rawVideoUrls && data.rawVideoUrls.length > 0;
  const hasIframes = data.videoIframes && data.videoIframes.length > 0;

  return (
    <div className="min-h-screen text-white pb-20 pt-20 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link
          to="/nekopoi"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Gallery
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
          {data.title}
        </h1>

        {/* Video Player Section */}
        {hasHlsVideos || hasIframes ? (
          <div className="space-y-4 mb-10">
            {/* Tab switcher if both available */}
            {hasHlsVideos && hasIframes && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setActiveTab("hls")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "hls"
                      ? "bg-yellow-600 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  <Play size={14} className="inline mr-1" /> Direct Player
                </button>
                <button
                  onClick={() => setActiveTab("iframe")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "iframe"
                      ? "bg-yellow-600 text-white"
                      : "bg-white/10 text-gray-400 hover:bg-white/20"
                  }`}
                >
                  <ExternalLink size={14} className="inline mr-1" /> Embed
                  Player
                </button>
              </div>
            )}

            {/* HLS Direct Player */}
            {activeTab === "hls" && hasHlsVideos && (
              <div className="space-y-6">
                {/* Stream Selector */}
                {data.rawVideoUrls.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {data.rawVideoUrls.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedStreamIndex(idx)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          selectedStreamIndex === idx
                            ? "bg-yellow-600 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        Stream {idx + 1}
                      </button>
                    ))}
                  </div>
                )}

                {/* Single Player */}
                <div className="space-y-2">
                  <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-yellow-500/10 bg-black">
                    <HlsVideoPlayer
                      key={selectedStreamIndex} // Force re-mount on change
                      videoUrl={data.rawVideoUrls[selectedStreamIndex].url}
                      referer={data.rawVideoUrls[selectedStreamIndex].referer}
                      title={`${data.title} - Stream ${selectedStreamIndex + 1}`}
                      index={selectedStreamIndex}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Iframe Fallback Player */}
            {activeTab === "iframe" && hasIframes && (
              <div className="space-y-6">
                {data.videoIframes.map((iframeSrc, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-yellow-500/10 bg-black">
                      <iframe
                        src={iframeSrc}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        title={`Nekopoi Video ${idx + 1}`}
                      ></iframe>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <a
                href={data.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1"
              >
                <ExternalLink size={12} /> Direct Link (Original Source)
              </a>
            </div>
          </div>
        ) : (
          // Fallback if no iframes found
          <div className="p-8 bg-white/5 rounded-2xl border border-white/10 text-center mb-10">
            <p className="text-gray-400 mb-4">
              Video stream could not be extracted directly.
            </p>
            <a
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-600 rounded-full hover:bg-yellow-700 transition-colors"
            >
              <ExternalLink size={20} /> Watch on Original Site
            </a>
          </div>
        )}

        {/* Download Buttons Section */}
        {data.downloadLinks && data.downloadLinks.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-500">
              <Download size={20} /> Download Options
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.downloadLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-lg text-sm transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Download size={14} className="text-yellow-500" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
