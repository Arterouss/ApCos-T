import React, { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Tv,
  Film,
  BookOpen,
  Sparkles,
  Compass,
  Clock,
  Star,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Zap,
  Globe,
  Layers,
  Play,
  Flame,
  ArrowRight,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { usePortalMode } from "../context/PortalContext";

// ── Carousel Component (Cyber-Luxe Cyan Theme) ──────────────────────────
const HubCarousel = ({ title, icon: Icon, tagColor = "text-neon-cyan", viewAllLink, children }) => {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -420 : 420, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10 sm:mb-14 relative group">
      <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
              }}
            >
              <Icon size={18} className={tagColor} />
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-display font-bold tracking-tight text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-semibold text-gray-400 hover:text-neon-cyan transition-colors flex items-center gap-1 group/btn mr-2"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="hidden sm:flex p-2 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden sm:flex p-2 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-8 py-2 snap-x">
        {children}
      </div>
    </div>
  );
};

// ── Futuristic Card Component ──────────────────────────────────────────
const HubFeatureCard = ({
  to,
  aspectClass = "aspect-[3/4]",
  widthClass = "w-36 sm:w-44",
  accentFrom = "from-cyan-500",
  accentTo = "to-violet-500",
  icon: CardIcon = Sparkles,
  title = "Segera Hadir",
  subtitle = "Coming Soon",
  badge,
  isLive = false,
}) => {
  const content = (
    <div
      className={`${widthClass} shrink-0 rounded-2xl overflow-hidden glass-card transition-transform duration-200 active:scale-95 md:hover:-translate-y-1.5 group cursor-pointer border border-white/10`}
    >
      <div className={`relative ${aspectClass} bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-surface-card overflow-hidden`}>
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" />

        {/* Ambient glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br ${accentFrom} ${accentTo} opacity-[0.12] blur-2xl group-hover:opacity-[0.25] transition-opacity`} />

        {/* Badge */}
        {badge && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
              style={{
                background: isLive ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: isLive ? '#00e5ff' : '#9ca3af',
                border: isLive ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Center Icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-4 text-center">
          <div
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accentFrom} ${accentTo} p-[1px] transform group-hover:scale-110 transition-transform duration-300`}
          >
            <div className="w-full h-full rounded-2xl bg-surface-card flex items-center justify-center">
              <CardIcon size={20} className="text-neon-cyan" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-gray-300 group-hover:text-white transition-colors line-clamp-1">
            {title}
          </span>
          <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
            {subtitle}
          </span>
        </div>
      </div>
      <div className="p-3 bg-white/[0.01]">
        <div className="h-3 bg-white/[0.05] rounded-full w-3/4 mb-1.5" />
        <div className="h-2 bg-white/[0.03] rounded-full w-1/2" />
      </div>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
};

// ── Genre Chips ────────────────────────────────────────────────────────
const GENRES = [
  { label: "⚔️ Action", color: "cyan" },
  { label: "🌍 Adventure", color: "emerald" },
  { label: "✨ Fantasy", color: "violet" },
  { label: "😂 Comedy", color: "amber" },
  { label: "💕 Romance", color: "pink" },
  { label: "🌀 Isekai", color: "sky" },
  { label: "🤖 Sci-Fi", color: "indigo" },
  { label: "🗡️ Shounen", color: "orange" },
  { label: "🎭 Drama", color: "rose" },
  { label: "🔮 Supernatural", color: "purple" },
  { label: "🏫 School", color: "blue" },
  { label: "🎵 Music", color: "teal" },
];

const CHIP_STYLES = {
  cyan: "hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)]",
  emerald: "hover:border-emerald-400/50 hover:text-emerald-300 hover:shadow-[0_0_15px_rgba(52,211,153,0.2)]",
  violet: "hover:border-violet-400/50 hover:text-violet-300 hover:shadow-[0_0_15px_rgba(167,139,250,0.2)]",
  amber: "hover:border-amber-400/50 hover:text-amber-300 hover:shadow-[0_0_15px_rgba(251,191,36,0.2)]",
  pink: "hover:border-pink-400/50 hover:text-pink-300 hover:shadow-[0_0_15px_rgba(244,114,182,0.2)]",
  sky: "hover:border-sky-400/50 hover:text-sky-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]",
  indigo: "hover:border-indigo-400/50 hover:text-indigo-300 hover:shadow-[0_0_15px_rgba(129,140,248,0.2)]",
  orange: "hover:border-orange-400/50 hover:text-orange-300 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]",
  rose: "hover:border-rose-400/50 hover:text-rose-300 hover:shadow-[0_0_15px_rgba(251,113,133,0.2)]",
  purple: "hover:border-purple-400/50 hover:text-purple-300 hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]",
  blue: "hover:border-blue-400/50 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(96,165,250,0.2)]",
  teal: "hover:border-teal-400/50 hover:text-teal-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.2)]",
};

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function GeneralHome({ onOpenSidebar }) {
  const navigate = useNavigate();
  const { togglePortalMode } = usePortalMode();

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#06070d]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-500/[0.07] blur-[160px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/[0.06] blur-[180px]" />
        <div className="absolute top-[40%] left-[55%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/[0.04] blur-[140px]" />
      </div>

      <div className="relative z-10">
        {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
        <div className="relative px-4 sm:px-8 pt-12 pb-14 sm:pt-20 sm:pb-20 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center">
            {/* Live Indicator Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 cursor-pointer"
              style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
                boxShadow: '0 0 20px rgba(0, 229, 255, 0.15)',
              }}
              onClick={() => navigate('/anime')}
            >
              <Radio size={12} className="text-neon-cyan animate-pulse" />
              <span className="text-neon-cyan text-xs font-bold tracking-wider uppercase">
                Otakudesu Anime Streaming Aktif
              </span>
              <ChevronRight size={13} className="text-neon-cyan" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-display font-black tracking-tight leading-[1.08] mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan via-sky-300 to-neon-purple drop-shadow-sm">
                Anime, Movie &amp; Manga
              </span>
              <br />
              <span className="text-white text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
                Semua Dalam Satu Platform
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-10"
            >
              Portal hiburan anime terlengkap di ApiCos HUB. Streaming anime ongoing &amp; completed dengan server super cepat, kualitas multi-resolusi, dan update episode setiap hari.
            </motion.p>

            {/* Hero Action Buttons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-4 flex-wrap mb-12"
            >
              <Link
                to="/anime"
                className="px-6 sm:px-8 py-3.5 rounded-2xl font-display font-bold text-sm sm:text-base text-black flex items-center gap-2.5 transition-all duration-300 shadow-xl group"
                style={{
                  background: 'linear-gradient(135deg, #00e5ff, #7c4dff)',
                  boxShadow: '0 10px 30px rgba(0, 229, 255, 0.3)',
                }}
              >
                <Play size={18} fill="black" />
                <span>Nonton Anime Sekarang</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <button
                onClick={togglePortalMode}
                className="px-6 py-3.5 rounded-2xl font-display font-semibold text-sm text-gray-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <Globe size={16} className="text-gray-400" />
                <span>Beralih ke Portal Cinema (18+)</span>
              </button>
            </motion.div>

            {/* Quick Stats Pill */}
            <div className="grid grid-cols-3 max-w-lg mx-auto gap-3 sm:gap-4">
              {[
                { icon: Tv, label: "Anime Series", value: "Otakudesu", active: true },
                { icon: Film, label: "Film Bioskop", value: "Soon", active: false },
                { icon: BookOpen, label: "Manga Reader", value: "Soon", active: false },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-3 sm:p-4 text-center transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(12px)',
                    border: stat.active ? '1px solid rgba(0, 229, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center"
                    style={{
                      background: stat.active ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      color: stat.active ? '#00e5ff' : '#9ca3af',
                    }}
                  >
                    <stat.icon size={16} />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mb-0.5">{stat.label}</div>
                  <div className="text-[10px] font-mono text-neon-cyan">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. FEATURE SPOTLIGHT: OTAKUDESU STREAMING ──────────────── */}
        <div className="px-4 sm:px-8 mb-14">
          <div
            className="rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all group"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(124, 77, 255, 0.05))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 229, 255, 0.03)',
            }}
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-neon-cyan bg-cyan-500/10 border border-cyan-500/20">
                  <Flame size={12} /> Fitur Aktif Sekarang
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                  Streaming Anime Subtitle Indonesia
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm max-w-xl">
                  Akses ribuan judul anime ongoing &amp; completed dari database Otakudesu. Streaming langsung tanpa buffering dengan player modern dan pilihan resolusi lengkap.
                </p>
              </div>

              <Link
                to="/anime"
                className="shrink-0 px-6 py-3.5 rounded-xl font-display font-bold text-sm text-black flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                style={{
                  background: '#00e5ff',
                  boxShadow: '0 8px 25px rgba(0, 229, 255, 0.4)',
                }}
              >
                <Tv size={16} />
                <span>Buka Katalog Anime</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. GENRE EXPLORER ──────────────────────────────────────── */}
        <div className="px-4 sm:px-8 mb-12">
          <div className="flex items-center gap-2.5 mb-4">
            <Compass size={18} className="text-neon-cyan" />
            <h2 className="text-base sm:text-lg font-display font-bold text-white">Jelajahi Genre Populer</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.label}
                onClick={() => navigate('/anime')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all duration-300 cursor-pointer ${CHIP_STYLES[g.color]}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#e5e7eb',
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 4. CAROUSEL: ANIME ONGOING ────────────────────────────── */}
        <HubCarousel title="Anime Sedang Tayang (Ongoing)" icon={Clock} tagColor="text-neon-cyan" viewAllLink="/anime?tab=ongoing">
          {Array.from({ length: 8 }).map((_, i) => (
            <HubFeatureCard
              key={`ongoing-${i}`}
              to="/anime"
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-cyan-500"
              accentTo="to-sky-400"
              icon={Tv}
              title={`Anime Ongoing #${i + 1}`}
              subtitle="Tersedia di Anime"
              badge="Otakudesu"
              isLive={true}
            />
          ))}
        </HubCarousel>

        {/* ── 5. CAROUSEL: ANIME TERPOPULER ─────────────────────────── */}
        <HubCarousel title="Anime Terpopuler &amp; Rekomendasi" icon={TrendingUp} tagColor="text-neon-purple" viewAllLink="/anime?tab=completed">
          {Array.from({ length: 8 }).map((_, i) => (
            <HubFeatureCard
              key={`popular-${i}`}
              to="/anime"
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-violet-500"
              accentTo="to-purple-400"
              icon={Star}
              title={`Top Anime #${i + 1}`}
              subtitle="Completed"
              badge="Pilihan"
              isLive={true}
            />
          ))}
        </HubCarousel>

        {/* ── 6. CAROUSEL: FILM & MOVIE ─────────────────────────────── */}
        <HubCarousel title="Film &amp; Movie Anime" icon={Film} tagColor="text-neon-cyan">
          {Array.from({ length: 6 }).map((_, i) => (
            <HubFeatureCard
              key={`movie-${i}`}
              to="/anime"
              aspectClass="aspect-video"
              widthClass="w-48 sm:w-60"
              accentFrom="from-indigo-500"
              accentTo="to-blue-400"
              icon={Play}
              title={`Movie Project #${i + 1}`}
              subtitle="Full HD"
              badge="Movie"
            />
          ))}
        </HubCarousel>

        {/* ── 7. CAROUSEL: MANGA & MANHWA ──────────────────────────── */}
        <HubCarousel title="Manga &amp; Manhwa Terpopuler" icon={BookOpen} tagColor="text-emerald-400">
          {Array.from({ length: 8 }).map((_, i) => (
            <HubFeatureCard
              key={`manga-${i}`}
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-emerald-500"
              accentTo="to-teal-400"
              icon={BookOpen}
              title={`Manga #${i + 1}`}
              subtitle="Reader Segera Hadir"
              badge="Coming Soon"
            />
          ))}
        </HubCarousel>

        {/* ── 8. BOTTOM HERO CARD ──────────────────────────────────── */}
        <div className="px-4 sm:px-8 mb-8">
          <div
            className="max-w-3xl mx-auto rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05), rgba(124, 77, 255, 0.05))',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(124, 77, 255, 0.2))',
                border: '1px solid rgba(0, 229, 255, 0.3)',
              }}
            >
              <Globe size={28} className="text-neon-cyan" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-black text-white mb-3">
              Koleksi Lengkap dalam Satu Akses
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto mb-8">
              Jelajahi ribuan anime dari Otakudesu secara gratis, nikmati streaming cepat dengan pemutar video pintar dan audio jernih.
            </p>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                to="/anime"
                className="px-6 py-3 rounded-xl font-display font-bold text-xs sm:text-sm text-black flex items-center gap-2 transition-all shadow-lg cursor-pointer"
                style={{
                  background: '#00e5ff',
                  boxShadow: '0 4px 20px rgba(0, 229, 255, 0.35)',
                }}
              >
                <Tv size={15} /> Buka Otakudesu Streaming
              </Link>

              <div
                className="px-4 py-3 rounded-xl text-xs font-semibold text-gray-400 flex items-center gap-2"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <ShieldCheck size={14} className="text-emerald-400" /> Bebas Iklan Pop-up
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
