import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCosplayDetail } from "../services/cosplayService";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

export default function CosplayDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getCosplayDetail(slug);
        setData(detail);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-neutral-950 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-500">
          {error ? "Error Loading Post" : "Post Not Found"}
        </h2>
        <p className="text-gray-400 mb-6 max-w-md">
          {error || "The requested cosplay post could not be found."}
        </p>
        <Link
          to="/cosplay"
          className="px-6 py-2 bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
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
          to="/cosplay"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} /> Back to Gallery
        </Link>

        <h1 className="text-2xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
          {data.title}
        </h1>

        {/* Video Players */}
        {data.videoIframes && data.videoIframes.length > 0 && (
          <div className="space-y-6 mb-10">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-pink-400">▶</span> Videos (
              {data.videoIframes.length})
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {data.videoIframes.map((iframeSrc, idx) => (
                <div
                  key={idx}
                  className="aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10 bg-black"
                >
                  <iframe
                    src={iframeSrc}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    title={`Cosplay Video ${idx + 1}`}
                  ></iframe>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Buttons Section */}
        {data.downloadLinks && data.downloadLinks.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download size={20} className="text-pink-400" /> Download Options
            </h3>
            <div className="flex flex-wrap gap-3">
              {data.downloadLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 transition-colors flex items-center gap-2 font-medium text-sm md:text-base"
                >
                  {link.label} <ExternalLink size={16} />
                </a>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              *Links usually redirect to file hosts like Mega, Mediafire, or
              Gofile.
            </p>
          </div>
        )}

        {/* Image Grid */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <ImageIcon size={20} className="text-purple-400" /> Gallery Preview
            ({data.images?.length || 0})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.images &&
              data.images.map((imgSrc, idx) => (
                <div
                  key={idx}
                  className="relative group rounded-xl overflow-hidden bg-gray-900 border border-white/5"
                >
                  <img
                    src={imgSrc}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={imgSrc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/40 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
