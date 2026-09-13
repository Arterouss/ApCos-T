import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, ExternalLink, Loader2, Camera, Play, X } from "lucide-react";
import { getFapelloModel } from "../services/fapelloService";

export default function FapelloDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await getFapelloModel(decodedSlug);
        setData(res);
      } catch (e) {
        setError("Gagal memuat profil model. " + (e.response?.data?.error || e.message));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-rose-400 animate-spin" />
          <p className="text-gray-500 text-sm">Memuat profil model...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center gap-4">
        <div className="text-4xl">😵</div>
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm hover:bg-rose-700 transition-colors">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-semibold text-sm text-white line-clamp-1 flex-1">{data?.name || "Profil Model"}</h1>
        {data?.original_url && (
          <a
            href={data.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/20 text-gray-400 hover:text-rose-400 transition-all"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-full border-4 border-rose-500/30 overflow-hidden bg-gray-900 shadow-xl shadow-rose-900/20">
            {data?.avatar ? (
              <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={40} className="text-gray-600" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left pt-2">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{data?.name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Users size={14} className="text-rose-400" />
                {data?.followers || "0"} Followers
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Camera size={14} className="text-rose-400" />
                {data?.posts?.length || 0} Media
              </span>
            </div>
          </div>
        </div>

        {/* Media Grid */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Camera size={16} className="text-rose-400" /> Gallery
          </h3>
          
          {data?.posts?.length === 0 ? (
            <div className="py-20 text-center text-gray-500">
              Belum ada media untuk model ini.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {data?.posts?.map((post, i) => (
                <motion.div
                  key={post.id || i}
                  whileHover={{ scale: 1.02 }}
                  className="relative cursor-pointer rounded-xl overflow-hidden aspect-[4/5] bg-gray-900 border border-white/5 group"
                  onClick={() => setSelectedMedia(post)}
                >
                  <img
                    src={post.cover_url}
                    alt={`Post ${i}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {post.is_video && (
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full p-1.5">
                      <Play size={14} className="text-white fill-white" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox / Media Viewer */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                {selectedMedia.is_video ? <Play size={16} /> : <Camera size={16} />}
                {selectedMedia.is_video ? "Video" : "Image"}
              </span>
              <div className="flex items-center gap-3">
                <a 
                  href={selectedMedia.href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
                  title="Buka di Fapello"
                >
                  <ExternalLink size={20} />
                </a>
                <button
                  className="text-white bg-white/10 hover:bg-rose-600/80 rounded-full p-2 transition-colors"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="w-full h-full flex items-center justify-center p-4 md:p-12" onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedMedia(null);
            }}>
              {/* If it's a video, Fapello usually redirects or plays in a new page, so we just show the cover and provide a link for now, or embed if we extract the actual MP4 URL. Since we only have cover_url and href from the list: */}
              {selectedMedia.is_video ? (
                 <div className="flex flex-col items-center gap-6">
                    <div className="relative rounded-lg overflow-hidden border border-white/20 max-h-[70vh]">
                      <img src={selectedMedia.cover_url} alt="Cover" className="max-h-[70vh] object-contain opacity-70 blur-sm" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={64} className="text-white drop-shadow-lg opacity-80" />
                      </div>
                    </div>
                    <a 
                      href={selectedMedia.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-rose-900/30 transition-all"
                    >
                      Tonton Video Penuh di Fapello <ExternalLink size={18} />
                    </a>
                 </div>
              ) : (
                <img
                  src={selectedMedia.cover_url}
                  alt="Fullscreen view"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
