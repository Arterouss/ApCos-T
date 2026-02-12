import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCavPornDetail } from "../services/cavpornService";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Play,
  AlertTriangle,
  Tag,
  Clock,
  ThumbsUp,
} from "lucide-react";

export default function CavPornDetailPage() {
  const { id, slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCavPornDetail(id, slug);
        setData(detail);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadDetail();
  }, [id, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-neutral-950 px-4 text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          Error Loading Video
        </h2>
        <p className="text-gray-400 mb-6 max-w-md">
          {error || "The requested video could not be found."}
        </p>
        <Link
          to="/cavporn"
          className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-white"
        >
          Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 pt-20 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link
          to="/cavporn"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Gallery
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent">
          {data.title}
        </h1>

        {/* Video Player - Server-side embed proxy handles everything */}
        <div className="mb-8">
          <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-red-500/10 bg-black">
            <iframe
              src={`/api/cavporn/player?id=${data.id}`}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media"
              title={data.title}
            />
          </div>
          <div className="flex justify-center mt-2">
            <a
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-500 hover:text-red-400 flex items-center gap-1"
            >
              <ExternalLink size={12} /> Open on Original Site
            </a>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Category */}
          {data.category && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Category
              </h3>
              <span className="text-white">{data.category}</span>
            </div>
          )}

          {/* Download */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
              <Download size={14} /> Download
            </h3>
            <a
              href={data.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition-colors text-sm border border-red-500/20"
            >
              <Download size={14} /> Download MP4
            </a>
          </div>

          {/* Original Link */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              Source
            </h3>
            <a
              href={data.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
            >
              <ExternalLink size={14} /> cav103.com
            </a>
          </div>
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Tag size={14} /> Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Link
                  key={tag.hash}
                  to="/cavporn"
                  onClick={() => {
                    // This will navigate back with the tag as search
                    // We rely on the page to pick up the state
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 text-gray-300 hover:text-white border border-white/5 hover:border-red-500/30 hover:bg-white/10 transition-all"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Videos */}
        {data.relatedVideos && data.relatedVideos.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Play size={20} className="text-red-500" /> Related Videos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {data.relatedVideos.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/cavporn/${rel.id}/${rel.slug}`}
                  className="group relative bg-white/5 rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/5 hover:border-red-500/30"
                >
                  <div className="aspect-video overflow-hidden relative">
                    <img
                      src={
                        rel.thumbnail ||
                        "https://via.placeholder.com/320x180?text=No+Thumb"
                      }
                      alt={rel.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-red-600/90 p-2 rounded-full backdrop-blur-sm">
                        <Play className="fill-white text-white" size={18} />
                      </div>
                    </div>

                    {rel.duration && (
                      <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-0.5">
                        <Clock size={8} />
                        {rel.duration}
                      </div>
                    )}
                  </div>

                  <div className="p-2">
                    <h4 className="font-medium text-xs line-clamp-2 group-hover:text-red-400 transition-colors">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
