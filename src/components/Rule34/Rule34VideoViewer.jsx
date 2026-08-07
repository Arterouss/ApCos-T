import React, { useEffect, useState } from "react";
import { X, Play, Loader2, Tag } from "lucide-react";
import { useRule34Video } from "../../hooks/useRule34Video";

export default function Rule34VideoViewer({ video, onClose }) {
  const { getVideoDetail } = useRule34Video();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      setLoading(true);
      const res = await getVideoDetail(video.slug);
      if (isMounted && res) {
        setDetail(res);
      }
      if (isMounted) {
        setLoading(false);
      }
    };
    
    fetchDetail();
    
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    
    return () => {
      isMounted = false;
      document.body.style.overflow = "auto";
    };
  }, [video, getVideoDetail]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-all z-50"
      >
        <X size={24} />
      </button>

      <div className="w-full max-w-5xl bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-white line-clamp-1">
            {detail?.title || video.title}
          </h2>
        </div>

        {/* Video Player Area */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center shrink-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-violet-500">
              <Loader2 size={48} className="animate-spin mb-4" />
              <p className="text-sm font-medium animate-pulse text-gray-300">
                Memuat Video Detail...
              </p>
            </div>
          ) : detail?.video_url ? (
            <video
              src={detail.video_url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : detail?.iframe_url ? (
            <iframe
              src={detail.iframe_url}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation"
            ></iframe>
          ) : (
            <div className="text-red-400">
              Gagal memuat sumber video. Video mungkin dihapus atau butuh bypass Cloudflare di backend.
            </div>
          )}
        </div>

        {/* Tags & Info Area */}
        <div className="p-4 overflow-y-auto custom-scrollbar">
          {!loading && detail && detail.tags && detail.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <div className="w-full flex items-center gap-2 text-gray-400 mb-2">
                <Tag size={16} />
                <span className="text-sm font-semibold uppercase tracking-wider">Tags</span>
              </div>
              {detail.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 hover:bg-violet-600/20 hover:text-white transition-colors cursor-pointer"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
