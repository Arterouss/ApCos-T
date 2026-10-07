import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Sparkles,
  Info,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f]">
        <div className="relative">
          <Loader2 size={48} className="text-neon-cyan animate-spin" />
          <div className="absolute inset-0 blur-xl bg-neon-cyan/20 animate-pulse" />
        </div>
        <p className="text-gray-400 text-xs sm:text-sm mt-4 font-mono tracking-wider">
          MEMUAT DETAIL ANIME...
        </p>
      </div>
    );
  }

  // Error
  if (error || !anime) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#07080f]">
        <div
          className="rounded-3xl p-8 max-w-md mx-auto"
          style={{
            background: 'rgba(18, 18, 28, 0.6)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
          }}
        >
          <AlertCircle size={48} className="text-neon-red mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Gagal Memuat Anime</h2>
          <p className="text-gray-400 text-xs mb-6">{error || "Data anime tidak ditemukan."}</p>
          <button
            onClick={() => navigate("/anime")}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all cursor-pointer"
            style={{ background: '#00e5ff' }}
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  const infoItems = [
    { icon: Star, label: "Skor", value: anime.score, accent: "text-amber-400" },
    { icon: Monitor, label: "Tipe", value: anime.type, accent: "text-neon-cyan" },
    { icon: Film, label: "Episode", value: anime.totalEpisodes, accent: "text-neon-purple" },
    { icon: Clock, label: "Durasi", value: anime.duration, accent: "text-sky-400" },
    { icon: Calendar, label: "Rilis", value: anime.releaseDate, accent: "text-emerald-400" },
    { icon: Tag, label: "Studio", value: anime.studio, accent: "text-pink-400" },
    { icon: Info, label: "Status", value: anime.status, accent: "text-violet-400" },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#07080f]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/[0.08] blur-[160px]" />
        <div className="absolute top-[20%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-purple-600/[0.06] blur-[180px]" />
      </div>

      <div className="relative z-10">
        {/* ── Cinematic Hero Banner ─────────────────────────────────── */}
        <div className="relative min-h-[380px] sm:min-h-[460px] overflow-hidden flex flex-col justify-between">
          {/* Background Blurred Backdrop */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl brightness-[0.25] transition-all duration-700"
            style={{ backgroundImage: `url(${anime.poster})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080f] via-[#07080f]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080f] via-transparent to-[#07080f]" />

          {/* Top Navigation Bar */}
          <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6">
            <button
              onClick={() => navigate("/anime")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Kembali ke Katalog</span>
            </button>
          </div>

          {/* Hero Content: Poster + Title + Chips */}
          <div className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-8">
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-end">
              {/* Poster Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-[140px] sm:w-[190px] aspect-[3/4] rounded-2xl overflow-hidden shrink-0 relative"
                style={{
                  border: '2px solid rgba(0, 229, 255, 0.3)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
                }}
              >
                <img
                  src={anime.poster}
                  alt={anime.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect fill='%23111827' width='300' height='400'/%3E%3Ctext fill='%234B5563' x='150' y='200' text-anchor='middle' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </motion.div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                {anime.status && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3"
                    style={{
                      background: 'rgba(0, 229, 255, 0.1)',
                      color: '#00e5ff',
                      border: '1px solid rgba(0, 229, 255, 0.3)',
                    }}
                  >
                    <Sparkles size={11} />
                    <span>{anime.status}</span>
                  </div>
                )}

                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl sm:text-4xl md:text-5xl font-display font-black text-white leading-tight mb-2 tracking-tight"
                >
                  {anime.title}
                </motion.h1>

                {anime.titleJapanese && (
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mb-4 line-clamp-1">
                    {anime.titleJapanese}
                  </p>
                )}

                {/* Genre Chips */}
                {anime.genres && anime.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {anime.genres.map((genre, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-xl text-xs font-semibold text-cyan-300"
                        style={{
                          background: 'rgba(0, 229, 255, 0.08)',
                          border: '1px solid rgba(0, 229, 255, 0.25)',
                        }}
                      >
                        {genre.name || genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Details Section ───────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-10">
          {/* Metadata Grid */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            {infoItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3.5 p-4 rounded-2xl transition-all"
                  style={{
                    background: 'rgba(14, 16, 26, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Icon size={18} className={item.accent} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold text-white truncate">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Synopsis */}
          {anime.synopsis && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl p-6 sm:p-8"
              style={{
                background: 'rgba(14, 16, 26, 0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <h2 className="text-lg font-display font-bold text-white mb-3 flex items-center gap-2">
                <Info size={18} className="text-neon-cyan" />
                <span>Sinopsis Lengkap</span>
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {anime.synopsis}
              </p>
            </motion.div>
          )}

          {/* Episode List */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2.5">
                <Play size={20} className="text-neon-cyan" fill="currentColor" />
                <span>Daftar Episode</span>
              </h2>
              <span
                className="text-xs font-mono font-semibold px-3 py-1 rounded-full text-neon-cyan"
                style={{
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                }}
              >
                {anime.episodes?.length || 0} Episode Tersedia
              </span>
            </div>

            {anime.episodes && anime.episodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {anime.episodes.map((ep) => (
                  <Link
                    key={ep.slug}
                    to={`/anime/watch/${ep.slug}`}
                    className="group flex items-center justify-between p-4 rounded-2xl transition-all duration-300"
                    style={{
                      background: 'rgba(14, 16, 26, 0.6)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.35)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(124, 77, 255, 0.2))',
                          border: '1px solid rgba(0, 229, 255, 0.3)',
                        }}
                      >
                        <Play size={14} className="text-neon-cyan fill-current" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-200 group-hover:text-neon-cyan transition-colors truncate">
                          {ep.title}
                        </p>
                        {ep.date && (
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{ep.date}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-gray-500 group-hover:text-neon-cyan group-hover:translate-x-1 transition-all shrink-0 ml-2"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div
                className="text-center py-12 rounded-2xl"
                style={{
                  background: 'rgba(14, 16, 26, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <p className="text-gray-400 text-xs">Belum ada episode yang tersedia.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
