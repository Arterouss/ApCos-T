import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Film,
  Monitor,
  Play,
  Loader2,
  AlertCircle,
  Tag,
  ChevronRight,
} from "lucide-react";

export default function AnimeDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/anime/detail/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAnime(data);
      } catch (err) {
        console.error("Fetch anime detail error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-white/40 text-sm">Memuat detail anime...</p>
      </div>
    );
  }

  // Error
  if (error || !anime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-red-400 font-semibold mb-2">Gagal Memuat</p>
        <p className="text-white/40 text-sm mb-4">{error || "Data tidak ditemukan"}</p>
        <button onClick={() => navigate("/anime")} className="px-6 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
          Kembali
        </button>
      </div>
    );
  }

  const infoItems = [
    { icon: Star, label: "Skor", value: anime.score },
    { icon: Monitor, label: "Tipe", value: anime.type },
    { icon: Film, label: "Episode", value: anime.totalEpisodes },
    { icon: Clock, label: "Durasi", value: anime.duration },
    { icon: Calendar, label: "Rilis", value: anime.releaseDate },
    { icon: Tag, label: "Studio", value: anime.studio },
    { icon: Tag, label: "Status", value: anime.status },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen pb-20">
      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <div className="relative h-[340px] sm:h-[400px] overflow-hidden">
        {/* Background blur poster */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl brightness-[0.3]"
          style={{ backgroundImage: `url(${anime.poster})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />

        {/* Back button */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <button
            onClick={() => navigate("/anime")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-white/20 transition-all text-sm"
          >
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>

        {/* Poster + Title */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 flex gap-5 items-end mt-4 sm:mt-8">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={anime.poster}
            alt={anime.title}
            className="w-[120px] sm:w-[160px] aspect-[3/4] rounded-2xl object-cover border-2 border-white/20 shadow-2xl flex-shrink-0"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%23111827' width='300' height='400'/%3E%3Ctext fill='%234B5563' x='150' y='200' text-anchor='middle' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
            }}
          />
          <div className="pb-2 min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight line-clamp-3"
            >
              {anime.title}
            </motion.h1>
            {anime.titleJapanese && (
              <p className="text-white/40 text-sm mt-1 line-clamp-1">{anime.titleJapanese}</p>
            )}
            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {anime.genres.map((genre, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold">
                    {genre.name || genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        {/* ── Info Grid ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8"
        >
          {infoItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
                <Icon size={18} className="text-cyan-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-white/80 font-semibold truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* ── Synopsis ───────────────────────────────────────────────── */}
        {anime.synopsis && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-white mb-3">Sinopsis</h2>
            <p className="text-white/60 text-sm leading-relaxed bg-white/5 rounded-xl p-5 border border-white/10">
              {anime.synopsis}
            </p>
          </motion.div>
        )}

        {/* ── Episode List ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Play size={18} className="text-cyan-400" />
              Daftar Episode
            </h2>
            <span className="text-white/40 text-sm">{anime.episodes?.length || 0} episode</span>
          </div>

          {anime.episodes && anime.episodes.length > 0 ? (
            <div className="space-y-2">
              {anime.episodes.map((ep, i) => (
                <Link
                  key={ep.slug}
                  to={`/anime/watch/${ep.slug}`}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Play size={14} className="text-cyan-400" fill="currentColor" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate group-hover:text-cyan-400 transition-colors">
                        {ep.title}
                      </p>
                      {ep.date && (
                        <p className="text-[11px] text-white/30 mt-0.5">{ep.date}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/20 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/40 text-sm">Belum ada episode.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
