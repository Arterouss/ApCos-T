import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { getHimeVideo } from "../services/hanimeService";
import Hls from "hls.js";
import { ArrowLeft, Eye, Calendar } from "lucide-react";

export default function HanimeDetailPage() {
  const { slug } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchVideo = async () => {
      try {
        const data = await getHimeVideo(slug);
        setVideo(data);
        if (data.sources && data.sources.length > 0) {
          const originalUrl = data.sources[0].url;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(originalUrl)}`;
          setupPlayer(proxyUrl);
        }
      } catch (error) {
        console.error("Failed to load video", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();

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
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="w-full bg-black aspect-video relative group">
        <video
          ref={videoRef}
          controls
          poster={video.poster_url}
          className="w-full h-full"
        />
        {(!video.sources || video.sources.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-500 font-bold">
            Stream Unavailable (Likely Blocked by Source)
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link
          to="/hanime"
          className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to HAnime
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
          {video.name}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>{video.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{new Date(video.released_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-900 border border-gray-800 rounded-full text-xs text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <div
            className="text-gray-400 text-sm leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: video.description }}
          />
        </div>
      </div>
    </div>
  );
}
