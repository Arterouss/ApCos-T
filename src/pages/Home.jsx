import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Film,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Book,
  Camera,
  Flame,
  Star,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Video,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import axios from "axios";

// Services
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { getPorn3dxList } from "../services/porn3dxService";
import { getDoujinList } from "../services/doujinService";
import { filterBlockedItems } from "../utils/contentFilter";

// Fallback high-impact hero wallpaper
const DEFAULT_HERO_BG =
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920&auto=format&fit=crop";

// ── Carousel Component ──────────────────────────────────────────────────
const MediaCarousel = ({
  title,
  icon: Icon,
  accentColor = "#ff2d55",
  viewAllLink,
  children,
}) => {
  const scrollRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -450 : 450;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Mouse drag-to-scroll for desktop & laptop
  const onMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const onMouseLeave = () => {
    isDown.current = false;
  };

  const onMouseUp = () => {
    isDown.current = false;
  };

  const onMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  return (
    <div className="mb-14 sm:mb-18 relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 mb-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}08)`,
                border: `1px solid ${accentColor}35`,
                boxShadow: `0 0 20px ${accentColor}20`,
              }}
            >
              <Icon size={18} style={{ color: accentColor }} />
            </div>
          )}
          <div>
            <h2 className="text-base sm:text-xl font-display font-black tracking-tight text-white flex items-center gap-2">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 group/btn mr-2 px-3 py-1.5 rounded-full glass-card border border-white/5 hover:border-white/20"
            >
              <span>Lihat Semua</span>
              <ChevronRight
                size={14}
                className="group-hover/btn:translate-x-0.5 transition-transform"
              />
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 rounded-full flex items-center justify-center glass-card hover:border-white/20 text-gray-400 hover:text-white transition-all shadow-md cursor-pointer"
            aria-label="Scroll Kiri"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 rounded-full flex items-center justify-center glass-card hover:border-white/20 text-gray-400 hover:text-white transition-all shadow-md cursor-pointer"
            aria-label="Scroll Kanan"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Track (Smooth Touch & Mouse Drag) */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-none px-4 sm:px-8 py-3 select-none active:cursor-grabbing cursor-grab"
        style={{
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ── Carousel Card ────────────────────────────────────────────────────────
const CarouselCard = ({
  onClick,
  image,
  title,
  badge,
  badgeColor = "#ff2d55",
  duration,
  hoverColor = "#ff2d55",
  aspectClass = "aspect-video",
  widthClass = "w-52 sm:w-64",
}) => (
  <div
    onClick={onClick}
    className={`${widthClass} shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-transform duration-200 active:scale-95 md:hover:-translate-y-1.5 group glass-card border border-white/10 flex flex-col justify-between`}
    style={{
      boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
    }}
  >
    <div className={`relative ${aspectClass} overflow-hidden bg-neutral-900 pointer-events-none`}>
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 md:group-hover:scale-105 pointer-events-none"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-neutral-900 pointer-events-none">
          <Film size={32} className="text-gray-700 pointer-events-none" />
        </div>
      )}

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

      {/* Top Badges */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 z-10 pointer-events-none">
        {badge && (
          <span
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white backdrop-blur-md shadow-md uppercase tracking-wider"
            style={{
              background: `${badgeColor}dd`,
              boxShadow: `0 2px 10px ${badgeColor}50`,
            }}
          >
            {badge}
          </span>
        )}
        {duration && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-gray-300 border border-white/10 ml-auto">
            {duration}
          </span>
        )}
      </div>

      {/* Center Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${hoverColor}, #ff6b35)`,
            boxShadow: `0 0 25px ${hoverColor}60`,
          }}
        >
          <Play size={20} className="fill-white ml-0.5 pointer-events-none" />
        </div>
      </div>
    </div>

    {/* Title Box */}
    <div className="p-3.5 pointer-events-none">
      <h3 className="font-bold text-xs sm:text-sm text-gray-200 line-clamp-2 group-hover:text-white transition-colors leading-snug">
        {title}
      </h3>
    </div>
  </div>
);

export default function Home({ onOpenSidebar }) {
  const navigate = useNavigate();

  const [featuredItem, setFeaturedItem] = useState(null);
  const [hentaiPlayVideos, setHentaiPlayVideos] = useState([]);
  const [porn3dxItems, setPorn3dxItems] = useState([]);
  const [doujinList, setDoujinList] = useState([]);
  const [telegramPhotos, setTelegramPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadShowcaseData() {
      setLoading(true);
      try {
        const [hpRes, p3dxRes, doujinRes, teleRes] = await Promise.allSettled([
          getHentaiPlayList(1),
          getPorn3dxList(1),
          getDoujinList(1),
          axios.get("/api/personal/photos"),
        ]);

        if (isMounted) {
          // HentaiPlay
          if (hpRes.status === "fulfilled" && hpRes.value?.videos) {
            const vids = filterBlockedItems(hpRes.value.videos);
            setHentaiPlayVideos(vids);
            if (vids.length > 0) {
              setFeaturedItem(vids[0]);
            }
          }

          // Porn3dx
          if (p3dxRes.status === "fulfilled") {
            const rawList = Array.isArray(p3dxRes.value)
              ? p3dxRes.value
              : p3dxRes.value?.items || [];
            const list = filterBlockedItems(rawList);
            setPorn3dxItems(list);
          }

          // Doujin
          if (doujinRes.status === "fulfilled") {
            const rawDList =
              doujinRes.value?.data ||
              (Array.isArray(doujinRes.value) ? doujinRes.value : []);
            const dList = filterBlockedItems(rawDList);
            setDoujinList(dList);
          }

          // Telegram Photos
          if (teleRes.status === "fulfilled" && teleRes.value?.data?.success) {
            setTelegramPhotos(teleRes.value.data.data.slice(0, 10));
          }
        }
      } catch (err) {
        console.error("Gagal memuat data showcase:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShowcaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Platform Cards Definition
  const platformCards = [
    {
      name: "HentaiPlay Cinema",
      sub: "Streaming Anime Video HD Sub Indo",
      path: "/hentaiplay",
      icon: Film,
      badge: "470+ Judul",
      color: "#ff2d55",
      gradient: "from-[#ff2d55]/20 to-[#ff6b35]/10",
    },
    {
      name: "Porn3dx Studio",
      sub: "Animasi 3D & Render 60 FPS",
      path: "/porn3dx",
      icon: Video,
      badge: "3D Community",
      color: "#00e5ff",
      gradient: "from-[#00e5ff]/20 to-[#00b0ff]/10",
    },
    {
      name: "Doujin Desu",
      sub: "Manga, Manhwa & Doujin Lengkap",
      path: "/doujin",
      icon: Book,
      badge: "Chapter Reader",
      color: "#ffb347",
      gradient: "from-[#ffb347]/20 to-[#ff6b35]/10",
    },
    {
      name: "NHentai Vault",
      sub: "Pustaka Doujinshi Klasik & Populer",
      path: "/nhentai",
      icon: Sparkles,
      badge: "Full Color & Tag",
      color: "#ec4899",
      gradient: "from-[#ec4899]/20 to-[#f43f5e]/10",
    },
    {
      name: "CavPorn Cinema",
      sub: "Katalog JAV & HLS Streaming",
      path: "/cavporn",
      icon: Layers,
      badge: "Direct Stream",
      color: "#38bdf8",
      gradient: "from-[#38bdf8]/20 to-[#0284c7]/10",
    },
    {
      name: "Cosplay & Foto",
      sub: "Galeri Cosplay Telegram HD",
      path: "/cosplay",
      icon: Camera,
      badge: "Set Eksklusif",
      color: "#a855f7",
      gradient: "from-[#a855f7]/20 to-[#7c3aed]/10",
    },
  ];

  // Shimmer skeleton
  const SkeletonCard = ({ w = "w-52 sm:w-64", h = "h-40" }) => (
    <div
      className={`${w} ${h} shrink-0 rounded-2xl overflow-hidden glass-card p-3 border border-white/5 space-y-3 animate-pulse`}
    >
      <div className="w-full h-24 bg-white/5 rounded-xl" />
      <div className="w-3/4 h-3 bg-white/5 rounded-md" />
      <div className="w-1/2 h-2.5 bg-white/5 rounded-md" />
    </div>
  );

  return (
    <div className="min-h-screen text-white pb-28">
      {/* ── 1. CINEMATIC HERO SPOTLIGHT ──────────────────────────────────── */}
      <div className="relative w-full min-h-[520px] lg:h-[68vh] max-h-[750px] overflow-hidden flex items-end">
        {/* Dynamic / Fallback Backdrop Wallpaper */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={
              featuredItem?.cover_url ||
              featuredItem?.thumbnail ||
              DEFAULT_HERO_BG
            }
            alt="Spotlight"
            className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.15] scale-105 transition-transform duration-1000 pointer-events-none"
          />
          {/* Multi-layered Cinema Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08080c] via-[#08080c]/80 to-transparent w-full lg:w-3/4 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08080c]/90 to-transparent pointer-events-none" />
        </div>

        {/* Ambient Neon Glows inside Hero (Desktop only for GPU performance) */}
        <div className="hidden md:block absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2d55]/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Hero Content Container (Split Grid) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pb-10 sm:pb-14 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            {/* Left Column: Info & Action */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-5">
              {/* Top Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#ff2d55] to-[#ff6b35] text-white shadow-lg shadow-[#ff2d55]/40 animate-pulse">
                  <Flame size={12} className="fill-white" /> SPOTLIGHT PREMIERE
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold glass-card border border-amber-500/30 text-amber-300">
                  <Star size={11} className="fill-amber-400 text-amber-400" /> 1080p
                  ULTRA HD
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold glass-card border border-white/10 text-gray-300">
                  <Shield size={11} className="text-emerald-400" /> Tanpa Iklan
                </span>
                {featuredItem?.duration && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold glass-card border border-white/10 text-gray-300">
                    <Clock size={11} /> {featuredItem.duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight leading-[1.1] drop-shadow-xl line-clamp-2">
                {featuredItem?.title || "Selamat Datang di ApiCos Cinema"}
              </h1>

              {/* Description */}
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl line-clamp-3 leading-relaxed drop-shadow-md">
                {featuredItem?.description ||
                  "Pusat hiburan multimedia pribadi terlengkap. Streaming anime video HD sub Indo, animasi 3D 60FPS, koleksi manga & doujinshi, hingga galeri cosplay premium Telegram."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {featuredItem ? (
                  <button
                    onClick={() =>
                      navigate(
                        `/hentaiplay/video/${encodeURIComponent(
                          featuredItem.slug
                        )}`
                      )
                    }
                    className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#ff2d55] via-rose-600 to-[#ff6b35] hover:from-rose-500 hover:to-orange-500 text-white font-black text-sm tracking-wide shadow-xl shadow-[#ff2d55]/40 transition-all duration-300 hover:scale-105 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Play size={18} className="fill-white" />
                    <span>Putar Sekarang</span>
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/hentaiplay")}
                    className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#ff6b35] text-white font-black text-sm tracking-wide shadow-xl shadow-[#ff2d55]/40 transition-all duration-300 hover:scale-105 flex items-center gap-2.5 cursor-pointer"
                  >
                    <Play size={18} className="fill-white" />
                    <span>Mulai Menonton</span>
                  </button>
                )}

                <button
                  onClick={() => navigate("/hentaiplay")}
                  className="px-6 py-3.5 rounded-full glass-card hover:border-[#ff2d55]/50 text-white font-bold text-sm tracking-wide transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  <Layers size={17} className="text-[#ff2d55]" />
                  <span>Jelajahi Katalog</span>
                </button>
              </div>
            </div>

            {/* Right Column: Floating 3D Teaser Card (Desktop) */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="relative group cursor-pointer" onClick={() => {
                if (featuredItem) navigate(`/hentaiplay/video/${encodeURIComponent(featuredItem.slug)}`);
                else navigate("/hentaiplay");
              }}>
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#ff2d55] to-[#ff6b35] opacity-40 blur-xl group-hover:opacity-75 transition-opacity duration-500" />
                <div className="relative rounded-3xl overflow-hidden glass-card border border-white/20 shadow-2xl aspect-[16/10] bg-black">
                  <img
                    src={
                      featuredItem?.cover_url ||
                      featuredItem?.thumbnail ||
                      DEFAULT_HERO_BG
                    }
                    alt="Featured Card"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ff2d55]/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider self-start mb-2">
                      <Zap size={11} /> Sedang Populer
                    </div>
                    <p className="text-white text-xs font-bold line-clamp-1">
                      {featuredItem?.title || "ApiCos Premiere Selection"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. PLATFORM HUB GRID (6 Interactive Cyber-Luxe Cards) ────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 sm:mt-8 mb-16 relative z-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#ff2d55]/15 border border-[#ff2d55]/30 flex items-center justify-center text-[#ff2d55]">
              <TrendingUp size={16} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                Platform Media Terpadu
              </h2>
              <p className="text-xs text-gray-400">
                Akses instan ke seluruh portal konten & arsip multimedia
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {platformCards.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.name}
                onClick={() => navigate(cat.path)}
                className="p-4 rounded-2xl glass-card border border-white/10 md:hover:border-white/30 cursor-pointer transition-transform duration-200 active:scale-95 md:hover:-translate-y-1 shadow-lg group relative overflow-hidden flex flex-col justify-between min-h-[135px]"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none`}
                />

                <div className="flex items-center justify-between relative z-10">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${cat.color}, ${cat.color}aa)`,
                      boxShadow: `0 4px 15px ${cat.color}40`,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: `${cat.color}40`,
                      color: cat.color,
                      background: `${cat.color}15`,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <div className="relative z-10 pt-3">
                  <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-white transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                    {cat.sub}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. CAROUSEL: TRENDING ANIME HENTAI ──────────────────────────── */}
      <MediaCarousel
        title="Trending Anime Hentai"
        icon={Flame}
        accentColor="#ff2d55"
        viewAllLink="/hentaiplay"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : hentaiPlayVideos.length > 0 ? (
          hentaiPlayVideos.slice(0, 14).map((item) => (
            <CarouselCard
              key={item.slug}
              onClick={() =>
                navigate(
                  `/hentaiplay/video/${encodeURIComponent(item.slug)}`
                )
              }
              image={item.cover_url || item.thumbnail}
              title={item.title}
              badge={item.categories?.[0] || "Premier"}
              badgeColor="#ff2d55"
              hoverColor="#ff2d55"
            />
          ))
        ) : (
          <div className="w-full py-8 px-6 rounded-2xl glass-card text-center border border-white/10 max-w-lg mx-auto">
            <Film size={32} className="mx-auto text-rose-500/50 mb-2" />
            <p className="text-gray-300 text-sm font-semibold">
              Menghubungkan ke Pusat Server HentaiPlay...
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Data sedang disinkronkan secara realtime.
            </p>
          </div>
        )}
      </MediaCarousel>

      {/* ── 4. CAROUSEL: TOP 3D ANIMATION ───────────────────────────────── */}
      <MediaCarousel
        title="Animasi 3D Unggulan (Porn3dx)"
        icon={Video}
        accentColor="#00e5ff"
        viewAllLink="/porn3dx"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} w="w-48 sm:w-56" h="h-44" />
          ))
        ) : porn3dxItems.length > 0 ? (
          porn3dxItems.slice(0, 14).map((item, i) => (
            <CarouselCard
              key={item.id || i}
              onClick={() =>
                navigate(`/porn3dx/${encodeURIComponent(item.slug)}`)
              }
              image={item.cover_url}
              title={item.title}
              badge={item.type === "video" ? "3D Video" : "3D Render"}
              badgeColor="#00e5ff"
              hoverColor="#00e5ff"
              duration={item.duration}
              widthClass="w-48 sm:w-56"
              aspectClass="aspect-[4/3]"
            />
          ))
        ) : (
          <div className="w-full py-6 px-6 rounded-2xl glass-card border border-white/10 max-w-lg mx-auto text-center">
            <Video size={32} className="mx-auto text-cyan-400/50 mb-2" />
            <h4 className="text-sm font-bold text-white">
              Animasi 3D Studio
            </h4>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              Kunjungi katalog Porn3dx atau Rule34 untuk ribuan video animasi 3D.
            </p>
            <Link
              to="/porn3dx"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/30 transition-colors"
            >
              Buka Katalog 3D &rarr;
            </Link>
          </div>
        )}
      </MediaCarousel>

      {/* ── 5. CAROUSEL: MANGA & DOUJINSHI ──────────────────────────────── */}
      <MediaCarousel
        title="Manga & Doujinshi Terpopuler"
        icon={Book}
        accentColor="#ffb347"
        viewAllLink="/doujin"
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} w="w-40 sm:w-48" h="h-56" />
          ))
        ) : doujinList.length > 0 ? (
          doujinList.slice(0, 14).map((item) => (
            <CarouselCard
              key={item.slug}
              onClick={() =>
                navigate(`/doujin/${encodeURIComponent(item.slug)}`)
              }
              image={item.cover_url || item.thumbnail}
              title={item.title}
              badge={item.score ? `⭐ ${item.score}` : "Doujin"}
              badgeColor="#ffb347"
              hoverColor="#ffb347"
              widthClass="w-40 sm:w-48"
              aspectClass="aspect-[3/4]"
            />
          ))
        ) : (
          <div className="w-full py-6 px-6 rounded-2xl glass-card border border-white/10 max-w-lg mx-auto text-center">
            <Book size={32} className="mx-auto text-amber-400/50 mb-2" />
            <h4 className="text-sm font-bold text-white">Doujinshi & Manga</h4>
            <p className="text-xs text-gray-400 mt-1 mb-3">
              Jelajahi koleksi komik Doujin Desu dan NHentai secara langsung.
            </p>
            <Link
              to="/doujin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors"
            >
              Buka Doujin Desu &rarr;
            </Link>
          </div>
        )}
      </MediaCarousel>

      {/* ── 6. CAROUSEL: FOTO TELEGRAM PRIBADI ──────────────────────────── */}
      {telegramPhotos.length > 0 && (
        <MediaCarousel
          title="Koleksi Vault Foto Telegram"
          icon={Camera}
          accentColor="#a855f7"
          viewAllLink="/personal-photo"
        >
          {telegramPhotos.map((photo) => (
            <CarouselCard
              key={photo.id}
              onClick={() => navigate("/personal-photo")}
              image={photo.proxyUrl || photo.url}
              title={photo.caption || "Foto Tersimpan"}
              badge="Telegram Sync"
              badgeColor="#a855f7"
              hoverColor="#a855f7"
              widthClass="w-40 sm:w-48"
              aspectClass="aspect-[3/4]"
            />
          ))}
        </MediaCarousel>
      )}
    </div>
  );
}
