import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getDoujinDetail } from "../services/doujinService";
import { ArrowLeft, BookOpen, Clock, AlertTriangle } from "lucide-react";

export default function DoujinDetailPage() {
  const params = useParams();
  const slug = params["*"] || params.slug || "";
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getDoujinDetail(slug);
        setData(result);
      } catch (err) {
        console.error("Failed to load Doujin detail", err);
        setError("Gagal memuat detail komik. Pastikan Cloudflare tidak memblokir koneksi.");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4" />
        <p className="text-gray-400 text-sm animate-pulse">Memuat Informasi Komik (Bypass Cloudflare)...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white pb-20 pt-16 px-4 flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-gray-300 max-w-md text-center">{error || "Data komik tidak ditemukan."}</p>
        <div className="flex gap-4 mt-6">
          <Link to="/doujin" className="px-5 py-2.5 bg-neutral-800 rounded-xl hover:bg-neutral-700">
            Kembali ke Galeri
          </Link>
          <a 
            href={`https://doujin.desu.xxx/${slug}/`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold"
          >
            Buka di Web Asli
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-20 pt-16 px-4 md:px-8 bg-neutral-950">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/doujin"
          className="inline-flex items-center text-gray-400 hover:text-indigo-400 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" /> Kembali ke Doujin Desu
        </Link>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover */}
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-900/20 relative aspect-[3/4]">
              <img 
                src={data.cover_url} 
                alt={data.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-3 py-1 bg-black/70 backdrop-blur rounded text-xs font-bold text-indigo-400 uppercase">
                {data.status}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-5xl font-black mb-4 leading-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {data.title}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {data.genres && data.genres.map(g => {
                const isNtr = g.toLowerCase().includes('ntr') || g.toLowerCase().includes('netorare');
                return (
                  <span 
                    key={g} 
                    className={`px-3 py-1 border rounded-full text-xs transition-colors ${
                      isNtr 
                        ? 'bg-red-600/90 text-white border-red-500 font-bold shadow-[0_0_8px_rgba(220,38,38,0.7)] animate-pulse'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    {g}
                  </span>
                );
              })}
            </div>

            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-400"/> Sinopsis
              </h3>
              <div 
                className="text-gray-300 text-sm leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: data.synopsis }}
              />
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
            <Clock size={24} className="text-indigo-500" /> Daftar Chapter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.chapters && data.chapters.length > 0 ? (
              data.chapters.map((chap, idx) => (
                <Link
                  key={`${chap.id}-${idx}`}
                  to={`/doujin/chapter/${chap.slug}`}
                  state={{ chapters: data.chapters, mangaSlug: slug }}
                  className="flex justify-between items-center p-4 bg-neutral-900 border border-white/5 rounded-xl hover:border-indigo-500/50 hover:bg-indigo-950/30 transition-all group"
                >
                  <span className="font-semibold text-gray-200 group-hover:text-indigo-300 line-clamp-1">
                    {chap.title}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {chap.date}
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center py-8">
                Tidak ada chapter ditemukan.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
