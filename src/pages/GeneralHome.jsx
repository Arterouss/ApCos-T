import React from "react";
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
} from "lucide-react";
import { usePortalMode } from "../context/PortalContext";
import { useRef } from "react";

// ── Carousel Component (Cyan Theme) ─────────────────────────────────────
const HubCarousel = ({ title, icon: Icon, tagColor = "text-cyan-400", viewAllLink, children }) => {
  const scrollRef = useRef(null);
  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10 sm:mb-14 relative group">
      <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={20} className={tagColor} />}
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-semibold text-gray-400 hover:text-cyan-400 transition-colors flex items-center gap-1 group/btn mr-2"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="hidden sm:flex p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden sm:flex p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-8 py-2 snap-x">
        {children}
      </div>
    </div>
  );
};

// ── Coming Soon Placeholder Card ────────────────────────────────────────
const ComingSoonCard = ({ aspectClass = "aspect-[3/4]", widthClass = "w-36 sm:w-44", accentFrom = "from-cyan-500", accentTo = "to-violet-500", icon: CardIcon = Sparkles, label = "Segera Hadir" }) => (
  <div className={`${widthClass} shrink-0 rounded-2xl overflow-hidden border border-white/[0.07] bg-neutral-900/70 backdrop-blur group cursor-default`}>
    <div className={`relative ${aspectClass} bg-gradient-to-br from-neutral-900 via-neutral-800/80 to-neutral-900 overflow-hidden`}>
      {/* Animated shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-shimmer" />
      {/* Glow circle */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br ${accentFrom} ${accentTo} opacity-[0.08] blur-2xl`} />
      {/* Icon */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accentFrom} ${accentTo} p-[1px]`}>
          <div className="w-full h-full rounded-xl bg-neutral-900 flex items-center justify-center">
            <CardIcon size={20} className="text-cyan-300" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
      </div>
    </div>
    <div className="p-3 space-y-1.5">
      <div className="h-3.5 bg-white/[0.04] rounded-full w-3/4" />
      <div className="h-2.5 bg-white/[0.03] rounded-full w-1/2" />
    </div>
  </div>
);

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

const CHIP_COLORS = {
  cyan: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30",
  emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30",
  violet: "bg-violet-500/15 border-violet-500/30 text-violet-300 hover:bg-violet-500/30",
  amber: "bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30",
  pink: "bg-pink-500/15 border-pink-500/30 text-pink-300 hover:bg-pink-500/30",
  sky: "bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/30",
  indigo: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30",
  orange: "bg-orange-500/15 border-orange-500/30 text-orange-300 hover:bg-orange-500/30",
  rose: "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/30",
  purple: "bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/30",
  blue: "bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/30",
  teal: "bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/30",
};

// ════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════
export default function GeneralHome({ onOpenSidebar }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] text-white pb-24 relative overflow-hidden">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-600/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-violet-600/[0.05] blur-[150px]" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-indigo-600/[0.04] blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* ── 1. HERO BANNER ────────────────────────────────────────── */}
        <div className="relative px-4 sm:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
          {/* Animated gradient border */}
          <div className="absolute inset-x-4 sm:inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <Zap size={12} className="animate-pulse" />
              <span>ApiCos HUB — Coming Soon</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] mb-5">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">
                Anime, Film &amp; Manga
              </span>
              <br />
              <span className="text-white/90 text-2xl sm:text-3xl md:text-4xl font-bold">
                Semua Dalam Satu Tempat
              </span>
            </h1>

            <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed mb-8">
              Portal hiburan anime, film bioskop, serial, dan manga/manhwa terlengkap. Fitur streaming, baca manga, dan jadwal rilis mingguan akan segera tersedia.
            </p>

            {/* Stats Preview */}
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              {[
                { icon: Tv, label: "Anime Series", value: "—" },
                { icon: Film, label: "Film & Movie", value: "—" },
                { icon: BookOpen, label: "Manga", value: "—" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/15 to-violet-500/15 border border-white/[0.06] flex items-center justify-center">
                    <stat.icon size={18} className="text-cyan-400" />
                  </div>
                  <span className="text-lg font-black text-white">{stat.value}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── 2. GENRE EXPLORER ──────────────────────────────────────── */}
        <div className="px-4 sm:px-8 mb-12">
          <div className="flex items-center gap-2.5 mb-4">
            <Compass size={18} className="text-violet-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Jelajahi Genre</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g.label}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-default ${CHIP_COLORS[g.color]}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. CAROUSEL: ANIME SEDANG TAYANG ──────────────────────── */}
        <HubCarousel title="Anime Sedang Tayang" icon={Clock} tagColor="text-cyan-400">
          {Array.from({ length: 8 }).map((_, i) => (
            <ComingSoonCard
              key={`ongoing-${i}`}
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-cyan-500"
              accentTo="to-sky-400"
              icon={Tv}
              label="Coming Soon"
            />
          ))}
        </HubCarousel>

        {/* ── 4. CAROUSEL: ANIME TERPOPULER ─────────────────────────── */}
        <HubCarousel title="Anime Terpopuler" icon={TrendingUp} tagColor="text-violet-400">
          {Array.from({ length: 8 }).map((_, i) => (
            <ComingSoonCard
              key={`popular-${i}`}
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-violet-500"
              accentTo="to-purple-400"
              icon={Star}
              label="Coming Soon"
            />
          ))}
        </HubCarousel>

        {/* ── 5. CAROUSEL: FILM & MOVIE ─────────────────────────────── */}
        <HubCarousel title="Film & Movie Anime" icon={Film} tagColor="text-indigo-400">
          {Array.from({ length: 6 }).map((_, i) => (
            <ComingSoonCard
              key={`movie-${i}`}
              aspectClass="aspect-video"
              widthClass="w-48 sm:w-60"
              accentFrom="from-indigo-500"
              accentTo="to-blue-400"
              icon={Play}
              label="Coming Soon"
            />
          ))}
        </HubCarousel>

        {/* ── 6. CAROUSEL: MANGA & MANHWA ──────────────────────────── */}
        <HubCarousel title="Manga & Manhwa Populer" icon={BookOpen} tagColor="text-emerald-400">
          {Array.from({ length: 8 }).map((_, i) => (
            <ComingSoonCard
              key={`manga-${i}`}
              aspectClass="aspect-[3/4]"
              widthClass="w-36 sm:w-44"
              accentFrom="from-emerald-500"
              accentTo="to-teal-400"
              icon={BookOpen}
              label="Coming Soon"
            />
          ))}
        </HubCarousel>

        {/* ── 7. BOTTOM CTA ────────────────────────────────────────── */}
        <div className="px-4 sm:px-8 mb-8">
          <div className="max-w-2xl mx-auto rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-r from-cyan-950/40 via-neutral-900/60 to-violet-950/40 p-8 sm:p-10 text-center backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 p-[1.5px] mx-auto mb-5">
              <div className="w-full h-full rounded-2xl bg-neutral-900 flex items-center justify-center">
                <Globe size={24} className="text-cyan-300" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
              Konten Segera Hadir
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-6">
              Halaman ini sedang dalam pengembangan. Streaming anime, baca manga, dan fitur film akan segera tersedia di update mendatang.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5">
                <Tv size={13} /> Anime Streaming
              </div>
              <div className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold flex items-center gap-1.5">
                <BookOpen size={13} /> Manga Reader
              </div>
              <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center gap-1.5">
                <Film size={13} /> Movie Library
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
