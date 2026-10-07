import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, Image, Book, Camera, Video, Menu, Heart, Sparkles, Film, Search, Home, Tv, BookOpen, Globe, Shield, Star, Compass, Bookmark, CheckCircle, Users, Zap, ArrowUpRight } from "lucide-react";
import { usePortalMode } from "../context/PortalContext";

// ── Menu untuk Mode 18+ (ApiCos Cinema) ─────────────────────────────────
const adultMenuCategories = [
  {
    title: "Koleksi & Favorit",
    items: [
      { name: "Favorit Saya", path: "/favorites", icon: <Heart size={18} /> },
      { name: "Video Pribadi", path: "/personal", icon: <Film size={18} /> },
      { name: "Foto Pribadi", path: "/personal-photo", icon: <Camera size={18} /> },
    ],
  },
  {
    title: "Manga & Doujin",
    items: [
      { name: "Nhentai", path: "/nhentai", icon: <Sparkles size={18} /> },
      { name: "Doujin Desu", path: "/doujin", icon: <Book size={18} /> },
    ]
  },
  {
    title: "Cinema & Video",
    items: [
      { name: "HentaiPlay", path: "/hentaiplay", icon: <Film size={18} /> },
      { name: "Jav.Guru", path: "/hanimetv", icon: <Film size={18} /> },
      { name: "Porn3dx (3D)", path: "/porn3dx", icon: <Film size={18} /> },
      { name: "CavPorn", path: "/cavporn", icon: <Video size={18} /> },
      { name: "Rule34", path: "/rule34", icon: <Image size={18} /> },
    ]
  },
  {
    title: "Cosplay & Foto",
    items: [
      { name: "Coomer.su", path: "/coomer", icon: <Users size={18} /> },
      { name: "Cosplay Tele", path: "/cosplay", icon: <Camera size={18} /> },
    ]
  }
];

// ── Menu untuk Mode Umum (ApiCos HUB) ───────────────────────────────────
const generalMenuCategories = [
  {
    title: "Anime Series",
    items: [
      { name: "Nonton Anime", path: "/anime", icon: <Tv size={18} /> },
      { name: "Anime Ongoing", path: "/anime?tab=ongoing", icon: <Tv size={18} /> },
      { name: "Anime Completed", path: "/anime?tab=completed", icon: <CheckCircle size={18} /> },
    ]
  },
  {
    title: "Film & Sinema",
    items: [
      { name: "Movie Anime", path: "/movie-anime", icon: <Film size={18} /> },
      { name: "Film Bioskop", path: "/movie-theater", icon: <Video size={18} /> },
    ]
  },
  {
    title: "Komik & Manga",
    items: [
      { name: "Manga Shounen", path: "/manga-shounen", icon: <BookOpen size={18} /> },
      { name: "Manhwa Webtoon", path: "/manhwa-webtoon", icon: <Book size={18} /> },
    ]
  },
  {
    title: "Koleksi",
    items: [
      { name: "Bookmark Anime", path: "/bookmark-anime", icon: <Bookmark size={18} /> },
    ]
  }
];

const SidebarContent = ({ onClose, location, onOpenSearch }) => {
  const { isAdultMode, togglePortalMode } = usePortalMode();

  const menuCategories = isAdultMode ? adultMenuCategories : generalMenuCategories;

  // Accent system
  const accent = isAdultMode
    ? {
        neon: "#ff2d55",
        neonRgb: "255, 45, 85",
        badge: "CINEMA",
        badgeIcon: <Shield size={10} />,
        logoGradient: "from-[#ff2d55] via-[#ff6b35] to-[#ffb347]",
        glowColor: "rgba(255, 45, 85, 0.15)",
        activeBg: "bg-[#ff2d55]/10",
        activeBorder: "border-[#ff2d55]/20",
        activeText: "text-[#ff2d55]",
        hoverText: "group-hover:text-[#ff2d55]",
        dotColor: "bg-[#ff2d55]",
        dotGlow: "shadow-[0_0_8px_rgba(255,45,85,0.8)]",
        searchFocus: "focus-within:border-[#ff2d55]/30 focus-within:shadow-[0_0_15px_rgba(255,45,85,0.1)]",
        switchTarget: "to-cyan",
        switchBg: "from-[#00e5ff]/10 to-[#7c4dff]/10",
        switchBorder: "border-[#00e5ff]/20 hover:border-[#00e5ff]/40",
        switchIcon: "text-[#00e5ff]",
        switchLabel: "text-[#00e5ff]",
        decorLine: "from-[#ff2d55] via-[#ff6b35] to-[#ffb347]",
      }
    : {
        neon: "#00e5ff",
        neonRgb: "0, 229, 255",
        badge: "HUB",
        badgeIcon: <Globe size={10} />,
        logoGradient: "from-[#00e5ff] via-[#40c4ff] to-[#7c4dff]",
        glowColor: "rgba(0, 229, 255, 0.15)",
        activeBg: "bg-[#00e5ff]/10",
        activeBorder: "border-[#00e5ff]/20",
        activeText: "text-[#00e5ff]",
        hoverText: "group-hover:text-[#00e5ff]",
        dotColor: "bg-[#00e5ff]",
        dotGlow: "shadow-[0_0_8px_rgba(0,229,255,0.8)]",
        searchFocus: "focus-within:border-[#00e5ff]/30 focus-within:shadow-[0_0_15px_rgba(0,229,255,0.1)]",
        switchTarget: "to-red",
        switchBg: "from-[#ff2d55]/10 to-[#ff6b35]/10",
        switchBorder: "border-[#ff2d55]/20 hover:border-[#ff2d55]/40",
        switchIcon: "text-[#ff2d55]",
        switchLabel: "text-[#ff2d55]",
        decorLine: "from-[#00e5ff] via-[#40c4ff] to-[#7c4dff]",
      };

  const [expandedCats, setExpandedCats] = useState(() => {
    const active = menuCategories.findIndex(cat => 
      cat.items.some(item => item.path === location.pathname)
    );
    return active !== -1 ? [active] : [0];
  });

  const [prevAdultMode, setPrevAdultMode] = useState(isAdultMode);
  if (prevAdultMode !== isAdultMode) {
    setPrevAdultMode(isAdultMode);
    setExpandedCats([0]);
  }

  // Auto-expand category on route change
  useEffect(() => {
    const idx = menuCategories.findIndex(cat => 
      cat.items.some(item => item.path === location.pathname)
    );
    if (idx !== -1) {
      setExpandedCats(prev => (prev.includes(idx) ? prev : [...prev, idx]));
    }
  }, [location.pathname, menuCategories]);

  const toggleCategory = (idx) => {
    setExpandedCats(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(12,12,18,0.97) 0%, rgba(8,8,12,0.99) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      }}
    >
      {/* ── Ambient Glow at Top ─────────────────────────────────────── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full pointer-events-none opacity-30 blur-[100px]"
        style={{ background: accent.glowColor }}
      />

      {/* ── Border Right (Desktop) ──────────────────────────────────── */}
      <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-white/[0.06] via-white/[0.03] to-transparent" />

      {/* ── Logo & Header ───────────────────────────────────────────── */}
      <div className="relative z-10 px-5 pt-5 pb-3 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <Link to="/" onClick={onClose} className="group flex items-center gap-2">
              {/* Logo Mark */}
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accent.neon}20, transparent)`,
                  border: `1px solid ${accent.neon}30`,
                }}
              >
                <Zap size={18} style={{ color: accent.neon }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle, ${accent.neon}15, transparent)` }}
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-xl font-display font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${accent.logoGradient} group-hover:brightness-125 transition-all duration-300`}>
                  ApiCos
                </span>
                <div className={`h-0.5 w-6 bg-gradient-to-r ${accent.decorLine} rounded-full mt-0 group-hover:w-full transition-all duration-500`} />
              </div>
            </Link>
            <AnimatePresence mode="wait">
              <motion.button
                key={accent.badge}
                onClick={togglePortalMode}
                initial={{ opacity: 0, scale: 0.7, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 5 }}
                transition={{ duration: 0.3 }}
                className="text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                style={{
                  background: `${accent.neon}18`,
                  color: accent.neon,
                  border: `1px solid ${accent.neon}30`,
                }}
                title={`Klik untuk beralih ke ${isAdultMode ? "Mode Anime (HUB)" : "Mode Cinema (18+)"}`}
              >
                {accent.badgeIcon}
                <span>{accent.badge}</span>
              </motion.button>
            </AnimatePresence>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/[0.06] rounded-xl cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Search Quick Trigger ─────────────────────────────────── */}
        <button
          onClick={() => {
            onOpenSearch?.();
            onClose?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-gray-400 hover:text-white transition-all group cursor-pointer ${accent.searchFocus}`}
        >
          <div className="flex items-center gap-2.5">
            <Search size={15} style={{ color: accent.neon }} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Cari di semua platform...</span>
          </div>
          <kbd className="text-[9px] bg-white/[0.04] border border-white/[0.08] px-1.5 py-0.5 rounded-md text-gray-500 font-mono group-hover:border-white/15 transition-colors">
            ⌘K
          </kbd>
        </button>

        {/* ── Beranda (Home) ───────────────────────────────────────── */}
        <Link
          to="/"
          onClick={onClose}
          className={`relative mt-2 flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
            location.pathname === "/"
              ? `text-white font-medium ${accent.activeBg} ${accent.activeBorder} border`
              : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
          }`}
        >
          <span className={`relative z-10 transition-all duration-300 ${
            location.pathname === "/" ? `${accent.activeText} scale-110` : accent.hoverText
          }`}>
            <Home size={18} />
          </span>
          <span className="tracking-wide relative z-10 text-sm">Beranda</span>
          {location.pathname === "/" && (
            <motion.div
              layoutId="sidebar-active-pill"
              className={`absolute right-3 w-1.5 h-1.5 rounded-full ${accent.dotColor} ${accent.dotGlow}`}
            />
          )}
        </Link>
      </div>

      {/* ── Separator ─────────────────────────────────────────────── */}
      <div className="h-px mx-5 shrink-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* ── Menu Categories ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 z-10 space-y-1 scrollbar-none">
        {menuCategories.map((category, idx) => {
          const isExpanded = expandedCats.includes(idx);
          const hasActiveItem = category.items.some(item => item.path === location.pathname);

          return (
            <div key={category.title} className="flex flex-col">
              <button
                onClick={() => toggleCategory(idx)}
                className="flex items-center justify-between w-full text-left py-2.5 px-2 transition-colors duration-200 group rounded-lg hover:bg-white/[0.02]"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2"
                  style={{ color: hasActiveItem ? accent.neon : 'rgb(107, 114, 128)' }}
                >
                  <span
                    className="w-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      background: hasActiveItem ? accent.neon : 'rgb(75, 85, 99)',
                      boxShadow: hasActiveItem ? `0 0 6px ${accent.neon}80` : 'none',
                    }}
                  />
                  {category.title}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={13} className={hasActiveItem ? accent.activeText : "text-gray-600 group-hover:text-white"} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pt-0.5 pb-2 pl-1">
                      {category.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            className={`relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group overflow-hidden ${
                              isActive
                                ? `text-white font-medium ${accent.activeBg} ${accent.activeBorder} border`
                                : "text-gray-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                            }`}
                          >
                            <span className={`relative z-10 transition-all duration-300 ${
                              isActive ? `${accent.activeText} scale-110` : accent.hoverText
                            }`}>
                              {item.icon}
                            </span>
                            <span className="tracking-wide relative z-10 text-[13px]">
                              {item.name}
                            </span>
                            {isActive && (
                              <motion.div
                                layoutId="sidebar-active-pill"
                                className={`absolute right-3 w-1.5 h-1.5 rounded-full ${accent.dotColor} ${accent.dotGlow}`}
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Bottom Section: Mode Switcher + Status ────────────────── */}
      <div className="mt-auto shrink-0 z-10">
        {/* Fade-out separator */}
        <div className="h-px mx-5 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Mode Switcher */}
        <div className="px-4 pt-3 pb-2">
          <motion.button
            onClick={togglePortalMode}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full relative flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-500 overflow-hidden group bg-gradient-to-r ${accent.switchBg} ${accent.switchBorder}`}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/[0.02]" />

            <AnimatePresence mode="wait">
              <motion.div
                key={isAdultMode ? "to-general" : "to-adult"}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center ${accent.switchIcon}`}
                style={{
                  background: isAdultMode ? 'rgba(0,229,255,0.1)' : 'rgba(255,45,85,0.1)',
                }}
              >
                {isAdultMode ? <Globe size={14} /> : <Shield size={14} />}
              </motion.div>
            </AnimatePresence>

            <div className="relative z-10 flex flex-col items-start">
              <AnimatePresence mode="wait">
                <motion.span
                  key={isAdultMode ? "label-general" : "label-adult"}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className={`text-xs font-bold ${accent.switchLabel}`}
                >
                  {isAdultMode ? "Mode Anime & Film" : "Mode ApiCos Cinema"}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] text-gray-600">Klik untuk beralih mode</span>
            </div>

            <div className={`relative z-10 ml-auto ${accent.switchIcon} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}>
              <ArrowUpRight size={14} />
            </div>
          </motion.button>
        </div>

        {/* System Status */}
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-2 text-[9px] text-gray-500 font-mono tracking-wider">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
              </div>
              <span>SYSTEM ONLINE</span>
            </div>
            <span className="text-[9px] text-gray-700 font-mono">v3.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ isOpen, onClose, onOpenSearch }) => {
  const location = useLocation();

  const sidebarVariants = {
    closed: {
      x: "-100%",
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    open: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  return (
    <>
      {/* Mobile Drawer */}
      <div className="md:hidden">
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50"
                style={{
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={sidebarVariants}
                className="fixed left-0 top-0 h-full w-72 z-[60]"
                style={{
                  boxShadow: '20px 0 60px rgba(0,0,0,0.8)',
                }}
              >
                <SidebarContent onClose={onClose} location={location} onOpenSearch={onOpenSearch} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Static Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-72 z-40">
        <SidebarContent onClose={onClose} location={location} onOpenSearch={onOpenSearch} />
      </div>
    </>
  );
};

export default Sidebar;
