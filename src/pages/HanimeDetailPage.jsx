import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getHimeVideo } from "../services/hanimeService";
import Hls from "hls.js";
import { ArrowLeft, Eye, Calendar } from "lucide-react";

export default function HanimeDetailPage() {
  const { slug } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeUrl, setActiveUrl] = useState(null);
  const [activeType, setActiveType] = useState("video");
  const [imgLoading, setImgLoading] = useState(false);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchVideo = async () => {
      try {
        const data = await getHimeVideo(slug);
        setVideo(data);

        // Set default source
        if (data.iframe_url) {
          setActiveUrl(data.iframe_url);
          // Try to find the type from sources if it matches
          const defaultSource = data.sources?.find((s) => s.isDefault);
          if (defaultSource) {
            setActiveType(defaultSource.type || "video");
            if (defaultSource.type === "image") setImgLoading(true);
          }
        } else if (data.sources && data.sources.length > 0) {
          setActiveUrl(data.sources[0].url);
          const type = data.sources[0].type || "video";
          setActiveType(type);
          if (type === "image") setImgLoading(true);
        }

        if (data.sources && data.sources.length > 0) {
          // Keep old HLS logic just in case, but usually we use iframe for Nekopoi
          const originalUrl = data.sources[0].url;
          // const proxyUrl = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
          // setupPlayer(proxyUrl);
        }
      } catch (error) {
        console.error("Failed to load video", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
    // ...

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [slug]);

  const setupPlayer = (url) => {
    if (Hls.isSupported() && videoRef.current) {
      if (hlsRef.current) hlsRef.current.destroy();
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(videoRef.current);
      hlsRef.current = hls;
    } else if (videoRef.current.canPlayType("application/vnd.apple.mpegurl")) {
      videoRef.current.src = url;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (!video) return <div className="text-white">Video not found</div>;

  return (
    <div className="min-h-screen text-white pb-20">
      <div className="w-full bg-black aspect-video relative group shadow-2xl shadow-purple-900/20 bg-grid-white/[0.02]">
        {activeUrl ? (
          activeType === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Loading Spinner for Image */}
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                key={activeUrl} // Force re-mount on URL change
                src={activeUrl}
                alt={video.name}
                className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setImgLoading(false)}
                onError={(e) => {
                  setImgLoading(false);
                  e.target.style.display = "none"; // Hide broken image
                }}
              />
            </div>
          ) : (
            <iframe
              src={activeUrl}
              title={video.name}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              scrolling="no"
              sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-500 font-bold backdrop-blur-sm">
            Stream Unavailable (Source Protected or Removed)
          </div>
        )}
      </div>

      {/* Source Selector */}
      {video.sources && video.sources.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 mt-4 flex gap-2 overflow-x-auto pb-2">
          {video.sources.map((src, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (activeUrl === src.url) return;
                setActiveUrl(src.url);
                const type = src.type || "video";
                setActiveType(type);
                if (type === "image") setImgLoading(true);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeUrl === src.url
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-500/20"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {[
                src.type && `[${src.type.toUpperCase()}]`,
                src.name || `Server ${idx + 1}`,
              ]
                .filter(Boolean)
                .join(" ")}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/hanime"
          className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="mr-2 group-hover:-translate-x-1 transition-transform"
          />{" "}
          Back to Discovery
        </Link>

        <h1 className="text-2xl md:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 leading-tight">
          {video.name}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-violet-400" />
            <span>{video.views ? video.views.toLocaleString() : 0} views</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-violet-400" />
            <span>
              {video.released_at
                ? new Date(video.released_at).toLocaleDateString()
                : "Unknown Date"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {video.tags &&
            video.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 transition-colors cursor-default"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-lg">
          <h3 className="text-lg font-bold mb-4 text-white">Synopsis</h3>
          <div
            className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none prose-p:my-2"
            dangerouslySetInnerHTML={{ __html: video.description }}
          />
        </div>
      </div>
    </div>
  );
}
