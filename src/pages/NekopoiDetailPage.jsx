import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNekopoiDetail } from "../services/nekopoiService";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Play,
  AlertTriangle,
} from "lucide-react";

export default function NekopoiDetailPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const detail = await getNekopoiDetail(slug);
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
        {data.videoIframes && data.videoIframes.length > 0 ? (
          <div className="space-y-8 mb-10">
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
            ))}
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
