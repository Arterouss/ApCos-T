import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  Video
} from "lucide-react";
import axios from "axios";

// Services
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { getPorn3dxList } from "../services/porn3dxService";
import { getDoujinList } from "../services/doujinService";
import { filterBlockedItems } from "../utils/contentFilter";

// Helper Carousel Component for smooth horizontal scrolling
const MediaCarousel = ({ title, icon: Icon, tagColor = "text-red-400", viewAllLink, children }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10 sm:mb-14 relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 sm:px-8 mb-4">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={20} className={tagColor} />}
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1 group/btn mr-2"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="hidden sm:flex p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all"
            aria-label="Scroll Left"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="hidden sm:flex p-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-gray-300 hover:text-white transition-all"
            aria-label="Scroll Right"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-8 py-2 snap-x"
      >
        {children}
      </div>
    </div>
  );
};

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
          // HentaiPlay Data
          if (hpRes.status === "fulfilled" && hpRes.value?.videos) {
            const vids = filterBlockedItems(hpRes.value.videos);
            setHentaiPlayVideos(vids);
            if (vids.length > 0) {
              // Pick first or a random popular item for Hero Banner
              setFeaturedItem(vids[0]);
            }
          }

          // Porn3dx Data
          if (p3dxRes.status === "fulfilled") {
            const rawList = Array.isArray(p3dxRes.value) ? p3dxRes.value : p3dxRes.value?.items || [];
            const list = filterBlockedItems(rawList);
            setPorn3dxItems(list);
          }

          // Doujin Data
          if (doujinRes.status === "fulfilled") {
            const rawDList = doujinRes.value?.data || (Array.isArray(doujinRes.value) ? doujinRes.value : []);
            const dList = filterBlockedItems(rawDList);
            setDoujinList(dList);
          }

          // Telegram Photos
          if (teleRes.status === "fulfilled" && teleRes.value?.data?.success) {
            setTelegramPhotos(teleRes.value.data.data.slice(0, 10));
          }
        }
      } catch (err) {
        console.error("Gagal memuat showcase data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadShowcaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { name: "HentaiPlay", path: "/hentaiplay", icon: Film, color: "from-rose-600 to-red-700" },
    { name: "Porn3dx (3D)", path: "/porn3dx", icon: Video, color: "from-indigo-600 to-cyan-600" },
    { name: "Nhentai", path: "/nhentai", icon: Sparkles, color: "from-pink-600 to-rose-600" },
    { name: "Doujin Desu", path: "/doujin", icon: Book, color: "from-amber-600 to-orange-600" },
    { name: "CavPorn", path: "/cavporn", icon: Film, color: "from-cyan-600 to-blue-600" },
    { name: "Foto Telegram", path: "/personal-photo", icon: Camera, color: "from-blue-600 to-emerald-600" },
  ];

  return (
    <div className="min-h-screen text-white bg-[#070709] pb-24">
      {/* ── 1. CINEMATIC HERO BANNER ────────────────────────────────────────── */}
      <div className="relative w-full h-[58vh] sm:h-[68vh] min-h-[420px] max-h-[720px] overflow-hidden bg-neutral-950">
        {featuredItem?.cover_url || featuredItem?.thumbnail ? (
          <img
            src={featuredItem.cover_url || featuredItem.thumbnail}
            alt={featuredItem.title}
            className="w-full h-full object-cover object-center scale-105 filter brightness-[0.75] contrast-[1.1] transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-red-950/40 via-neutral-900 to-black" />
        )}

        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/70 to-transparent w-full sm:w-2/3" />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#070709]/80 to-transparent" />

        {/* Hero Content Information */}
        <div className="absolute bottom-6 sm:bottom-12 inset-x-0 px-4 sm:px-10 max-w-4xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-3 sm:space-y-4"
          >
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded bg-red-600 text-white uppercase tracking-widest shadow-lg shadow-red-600/40">
                SPOTLIGHT
              </span>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
                <Star size={11} className="fill-amber-400 text-amber-400" /> 1080p ULTRA HD
              </span>
              {featuredItem?.duration && (
                <span className="text-[10px] sm:text-xs text-gray-300 bg-black/50 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md flex items-center gap-1">
                  <Clock size={11} /> {featuredItem.duration}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight line-clamp-2 leading-tight drop-shadow-md">
              {featuredItem?.title || "Selamat Datang di ApiCos Cinema"}
            </h1>

            {/* Description / Subtitle */}
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl line-clamp-2 drop-shadow">
              Platform streaming pribadi terpadu. Nikmati ribuan koleksi video anime hentai sub Indo/Eng, animasi 3D, manga & doujinshi, hingga galeri pribadi permanen tanpa iklan.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {featuredItem && (
                <button
                  onClick={() => navigate(`/hentaiplay/video/${encodeURIComponent(featuredItem.slug)}`)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm sm:text-base flex items-center gap-2 shadow-xl shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play size={18} className="fill-white" />
                  <span>Tonton Sekarang</span>
                </button>
              )}

              <button
                onClick={() => navigate("/hentaiplay")}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/15 backdrop-blur-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Layers size={18} />
                <span>Jelajahi Katalog</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── 2. QUICK PLATFORM SHORTCUTS (PILLS BAR) ────────────────────────── */}
      <div className="px-4 sm:px-8 -mt-4 sm:-mt-6 relative z-20 mb-8 sm:mb-12">
        <div className="p-2 sm:p-3 rounded-2xl bg-[#0e0e12]/90 border border-white/10 shadow-2xl backdrop-blur-xl flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-white/10 shrink-0">
            <TrendingUp size={14} className="text-red-400" /> Platform
          </div>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.name}
                onClick={() => navigate(cat.path)}
                className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/5 hover:border-red-500/40 text-gray-200 hover:text-white transition-all text-xs sm:text-sm font-semibold group cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center text-white shadow-sm`}>
                  <Icon size={12} />
                </div>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. CAROUSEL: TRENDING ANIME DI HENTAIPLAY ────────────────────────── */}
      <MediaCarousel
        title="Trending Anime Hentai"
        icon={Flame}
        tagColor="text-red-500"
        viewAllLink="/hentaiplay"
      >
        {hentaiPlayVideos.length > 0
          ? hentaiPlayVideos.slice(0, 12).map((item) => (
              <motion.div
                key={item.slug}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/hentaiplay/video/${encodeURIComponent(item.slug)}`)}
                className="w-48 sm:w-60 shrink-0 bg-neutral-900/80 border border-white/10 hover:border-red-500/60 rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all group"
              >
                <div className="relative aspect-video bg-black/60 overflow-hidden">
                  {item.cover_url || item.thumbnail ? (
                    <img
                      src={item.cover_url || item.thumbnail}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                      <Film size={28} className="text-gray-600" />
                    </div>
                  )}
                  {item.categories?.length > 0 && (
                    <span className="absolute top-2 left-2 bg-red-600/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow">
                      {item.categories[0]}
                    </span>
                  )}
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/50">
                      <Play size={18} className="fill-white translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-48 sm:w-60 h-36 bg-white/5 animate-pulse rounded-xl shrink-0" />
            ))}
      </MediaCarousel>

      {/* ── 4. CAROUSEL: TOP ANIMASI 3D DI PORN3DX ───────────────────────────── */}
      <MediaCarousel
        title="Animasi 3D Populer (Porn3dx)"
        icon={Video}
        tagColor="text-cyan-400"
        viewAllLink="/porn3dx"
      >
        {porn3dxItems.length > 0
          ? porn3dxItems.slice(0, 12).map((item, i) => (
              <motion.div
                key={item.id || i}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/porn3dx/${encodeURIComponent(item.slug)}`)}
                className="w-44 sm:w-56 shrink-0 bg-neutral-900/80 border border-white/10 hover:border-cyan-500/60 rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all group"
              >
                <div className="relative aspect-[4/3] bg-black/60 overflow-hidden">
                  <img
                    src={item.cover_url}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
                      {item.duration}
                    </span>
                  )}
                  <span className="absolute top-2 left-2 bg-cyan-600/90 text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow">
                    {item.type === "video" ? "3D Video" : "3D Render"}
                  </span>
                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/50">
                      <Play size={18} className="fill-white translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-44 sm:w-56 h-40 bg-white/5 animate-pulse rounded-xl shrink-0" />
            ))}
      </MediaCarousel>

      {/* ── 5. CAROUSEL: MANGA & DOUJINSHI PILIHAN ──────────────────────────── */}
      <MediaCarousel
        title="Manga & Doujinshi Terpopuler"
        icon={Book}
        tagColor="text-amber-400"
        viewAllLink="/doujin"
      >
        {doujinList.length > 0
          ? doujinList.slice(0, 12).map((item) => (
              <motion.div
                key={item.slug}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/doujin/${encodeURIComponent(item.slug)}`)}
                className="w-36 sm:w-44 shrink-0 bg-neutral-900/80 border border-white/10 hover:border-amber-500/60 rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all group"
              >
                <div className="relative aspect-[3/4] bg-black/60 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {item.score && (
                    <span className="absolute top-2 left-2 bg-black/70 backdrop-blur text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                      ⭐ {item.score}
                    </span>
                  )}
                  {item.type && (
                    <span className="absolute bottom-2 right-2 bg-amber-600/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {item.type}
                    </span>
                  )}
                </div>
                <div className="p-2.5 sm:p-3">
                  <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </p>
                </div>
              </motion.div>
            ))
          : Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-36 sm:w-44 h-48 bg-white/5 animate-pulse rounded-xl shrink-0" />
            ))}
      </MediaCarousel>

      {/* ── 6. CAROUSEL: FOTO TELEGRAM TERBARU (MONGODB ATLAS) ──────────────── */}
      {telegramPhotos.length > 0 && (
        <MediaCarousel
          title="Koleksi Galeri Telegram Pribadi"
          icon={Camera}
          tagColor="text-blue-400"
          viewAllLink="/personal-photo"
        >
          {telegramPhotos.map((photo) => (
            <motion.div
              key={photo.id}
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/personal-photo")}
              className="w-36 sm:w-44 shrink-0 bg-neutral-900/80 border border-white/10 hover:border-blue-500/60 rounded-xl overflow-hidden cursor-pointer shadow-lg transition-all group"
            >
              <div className="relative aspect-[3/4] bg-black/60 overflow-hidden">
                <img
                  src={photo.proxyUrl || photo.url}
                  alt={photo.caption || "Telegram Photo"}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 left-2 bg-blue-600/90 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">
                  Telegram Sync
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-white text-xs font-semibold line-clamp-1 group-hover:text-blue-300 transition-colors">
                  {photo.caption || "Foto Tersimpan"}
                </p>
                {photo.date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(photo.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </MediaCarousel>
      )}
    </div>
  );
}
