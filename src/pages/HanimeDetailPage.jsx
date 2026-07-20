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
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500 mb-4" />
        <p className="text-gray-400 text-sm animate-pulse">Menghubungkan ke server PornavHD...</p>
      </div>
    );

  if (!video || !video.iframe_url) {
    const originalUrl = video?.original_url || `https://pornavhd.com/${slug || ""}`;
    return (
      <div className="min-h-screen bg-neutral-950 text-white pb-20 pt-16 px-4 md:px-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-neutral-900/90 border border-fuchsia-500/30 rounded-3xl p-8 shadow-2xl shadow-fuchsia-950/40 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <div className="w-16 h-16 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Dilindungi Keamanan Cloudflare PornavHD
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">
            Situs asal (<strong className="text-fuchsia-300">pornavhd.com</strong>) saat ini mengaktifkan proteksi Cloudflare Turnstile Anti-Bot atau pembatasan IP server, sehingga sistem scraper tidak dapat mengekstrak link video/iframe secara otomatis.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 font-bold rounded-xl shadow-lg shadow-fuchsia-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
              <span>👉 Buka & Tonton Langsung di PornavHD</span>
            </a>
            <Link
              to="/hanimetv"
              className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-xl text-gray-300 hover:text-white font-medium flex items-center justify-center transition-colors"
            >
              🎬 Server Tanpa Blokir (Jav.Guru)
            </Link>
          </div>

          <div className="flex justify-between items-center border-t border-white/10 pt-4 text-xs text-gray-400">
            <Link to="/hanime" className="hover:text-fuchsia-400 flex items-center gap-1">
              <ArrowLeft size={14} /> Kembali ke Galeri
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="hover:text-fuchsia-400 underline"
            >
              🔄 Coba Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 pt-16 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-5xl mx-auto mb-5">
        <Link
          to="/hanime"
          className="inline-flex items-center text-gray-400 hover:text-fuchsia-400 transition-colors text-sm"
        >
          <ArrowLeft size={16} className="mr-2" /> Kembali ke Galeri PornavHD
        </Link>
      </div>

      <div className="max-w-5xl mx-auto bg-black aspect-video relative group rounded-3xl overflow-hidden shadow-2xl shadow-fuchsia-900/20 border border-white/10">
        {activeUrl ? (
          activeType === "image" ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {imgLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                key={activeUrl}
                src={activeUrl}
                alt={video.name}
                className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setImgLoading(false)}
                onError={(e) => {
                  setImgLoading(false);
                  e.target.style.display = "none";
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
            />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-center p-6 backdrop-blur-sm">
            <span className="text-3xl mb-3">🛡️</span>
            <p className="text-fuchsia-400 font-bold mb-2">Stream Iframe Tidak Tersedia</p>
            <p className="text-gray-400 text-sm max-w-md mb-4">Situs asal mengunci pemutaran iframe di luar domain mereka.</p>
            <a
              href={video.original_url || `https://pornavhd.com/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-bold text-sm shadow-lg transition-all"
            >
              👉 Tonton Langsung di Web Asli
            </a>
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
