import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getDoujinDetail } from "../services/doujinService";
import { useReadProgress } from "../hooks/useReadProgress";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { filterBlockedTags } from "../utils/contentFilter";

export default function DoujinDetailPage() {
  const params = useParams();
  const slug = params["*"] || params.slug || "";

  const { isRead } = useReadProgress(slug);
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
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={18} className="text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          Memuat Manga & Chapter...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 text-center">
        <div className="glass-card p-8 rounded-3xl max-w-md border border-white/10 shadow-2xl">
          <AlertTriangle size={44} className="mx-auto text-amber-400 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-white">Gagal Memuat Komik</h2>
          <p className="text-gray-400 text-sm mb-6">{error || "Data komik tidak ditemukan."}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/doujin"
              className="px-6 py-2.5 rounded-full glass-card border border-white/10 hover:border-indigo-500/40 text-sm font-semibold transition-all"
            >
              Kembali ke Galeri
            </Link>
            <a
              href={`https://doujin.desu.xxx/${slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
            >
              Buka di Web Asli
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pb-24 pt-6 md:pt-14 px-3.5 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/doujin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-white/10 hover:border-indigo-500/40 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold transition-all group shadow-md"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Doujin Desu
          </Link>

          <a
            href={`https://doujin.desu.xxx/${slug}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full glass-card border border-white/10 hover:border-indigo-500/40 text-gray-400 hover:text-indigo-300 transition-all text-xs flex items-center gap-1.5"
            title="Buka di Sumber Asli"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Hero Banner & Details */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="w-full sm:w-64 md:w-72 flex-shrink-0 mx-auto md:mx-0">
              <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl shadow-indigo-950/50 relative aspect-[3/4] bg-neutral-900 group">
                <img
                  src={data.cover_url}
                  alt={data.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {data.status && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[11px] font-bold text-indigo-300 uppercase tracking-wider border border-indigo-500/30">
                    {data.status}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={12} className="text-indigo-400" /> Doujin Series
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight font-display mb-4">
                  {data.title}
                </h1>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {data.genres &&
                    filterBlockedTags(data.genres).map((g) => {
                      const isNtr =
                        g.toLowerCase().includes("ntr") ||
                        g.toLowerCase().includes("netorare");
                      return (
                        <span
                          key={g}
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                            isNtr
                              ? "bg-red-600/20 text-red-300 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse"
                              : "glass-card border-white/10 text-gray-300 hover:border-indigo-500/30 hover:text-indigo-200"
                          }`}
                        >
                          {g}
                        </span>
                      );
                    })}
                </div>
              </div>

              {/* Synopsis */}
              {data.synopsis && (
                <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
                  <h3 className="font-bold text-sm text-indigo-300 flex items-center gap-2">
                    <BookOpen size={16} /> Sinopsis Cerita
                  </h3>
                  <div
                    className="text-gray-300 text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none line-clamp-6"
                    dangerouslySetInnerHTML={{ __html: data.synopsis }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Clock size={22} className="text-indigo-400" />
              Daftar Chapter
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-gray-400">
              {data.chapters ? data.chapters.length : 0} Chapter
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.chapters && data.chapters.length > 0 ? (
              data.chapters.map((chap, idx) => {
                const read = isRead(chap.slug);
                return (
                  <Link
                    key={`${chap.id || idx}-${chap.slug}`}
                    to={`/doujin/chapter/${chap.slug}`}
                    state={{ chapters: data.chapters, mangaSlug: slug }}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group ${
                      read
                        ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400/60"
                        : "glass-card border-white/10 hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {read ? (
                        <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                          <CheckCircle2 size={16} />
                        </div>
                      ) : (
                        <div className="p-1.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 flex-shrink-0 transition-colors">
                          <BookOpen size={14} />
                        </div>
                      )}
                      <span
                        className={`font-semibold text-xs sm:text-sm line-clamp-1 transition-colors ${
                          read
                            ? "text-emerald-300"
                            : "text-gray-200 group-hover:text-indigo-300"
                        }`}
                      >
                        {chap.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] text-gray-500">
                        {chap.date}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </Link>
                );
              })
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
