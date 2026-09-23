import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, Image, Book, Camera, Video, Menu, Heart, Sparkles, Film, Search, Home, Tv, BookOpen, Globe, Shield, Star, Compass, Bookmark } from "lucide-react";
import { usePortalMode } from "../context/PortalContext";

// ── Menu untuk Mode 18+ (ApiCos Cinema) ─────────────────────────────────
const adultMenuCategories = [
  {
    title: "Koleksi & Favorit",
    items: [
      { name: "Favorit Saya", path: "/favorites", icon: <Heart size={20} /> },
      { name: "Video Pribadi", path: "/personal", icon: <Film size={20} /> },
      { name: "Foto Pribadi", path: "/personal-photo", icon: <Camera size={20} /> },
    ],
  },
  {
    title: "Manga & Doujin",
    items: [
      { name: "Nhentai", path: "/nhentai", icon: <Sparkles size={20} /> },
      { name: "Doujin Desu", path: "/doujin", icon: <Book size={20} /> },
    ]
  },
  {
    title: "Cinema & Video",
    items: [
      { name: "HentaiPlay", path: "/hentaiplay", icon: <Film size={20} /> },
      { name: "Jav.Guru", path: "/hanimetv", icon: <Film size={20} /> },
      { name: "Porn3dx (3D)", path: "/porn3dx", icon: <Film size={20} /> },
      { name: "CavPorn", path: "/cavporn", icon: <Video size={20} /> },
      { name: "Rule34", path: "/rule34", icon: <Image size={20} /> },
    ]
  },
  {
    title: "Cosplay & Foto",
    items: [
      { name: "Fapello", path: "/fapello", icon: <Camera size={20} /> },
      { name: "Cosplay Tele", path: "/cosplay", icon: <Camera size={20} /> },
    ]
  }
];

// ── Menu untuk Mode Umum (ApiCos HUB) ───────────────────────────────────
const generalMenuCategories = [
  {
    title: "Anime Series",
    items: [
      { name: "Anime Ongoing", path: "/anime-ongoing", icon: <Tv size={20} /> },
      { name: "Anime Populer", path: "/anime-popular", icon: <Star size={20} /> },
      { name: "Jadwal Mingguan", path: "/anime-schedule", icon: <Compass size={20} /> },
    ]
  },
  {
    title: "Film & Sinema",
    items: [
      { name: "Movie Anime", path: "/movie-anime", icon: <Film size={20} /> },
      { name: "Film Bioskop", path: "/movie-theater", icon: <Video size={20} /> },
    ]
  },
  {
    title: "Komik & Manga",
    items: [
      { name: "Manga Shounen", path: "/manga-shounen", icon: <BookOpen size={20} /> },
      { name: "Manhwa Webtoon", path: "/manhwa-webtoon", icon: <Book size={20} /> },
    ]
  },
  {
    title: "Koleksi",
    items: [
      { name: "Bookmark Anime", path: "/bookmark-anime", icon: <Bookmark size={20} /> },
    ]
  }
];

const SidebarContent = ({ onClose, location, onOpenSearch }) => {
  const { isAdultMode, isGeneralMode, togglePortalMode } = usePortalMode();

  const menuCategories = isAdultMode ? adultMenuCategories : generalMenuCategories;

  // Accent colors based on mode
  const accent = isAdultMode
    ? {
        logoGradient: "from-red-500 via-rose-500 to-amber-400",
        badge: "CINEMA",
        badgeBg: "bg-red-600/30 text-red-400 border-red-500/40",
        glowTop: "from-rose-900/25",
        activeGradient: "from-red-600/30 to-rose-600/10",
        activeBorder: "border-red-500/30",
        activeText: "text-red-400",
        activeHover: "group-hover:text-red-300",
        activePill: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]",
        activeDot: "bg-red-500",
        searchBorderHover: "hover:border-red-500/50",
        searchIcon: "text-red-400",
        berandaActive: "shadow-rose-950/40 from-red-600/30 to-rose-600/10 border-red-500/30",
        berandaIcon: "text-red-400",
        berandaHoverIcon: "group-hover:text-red-300",
        berandaPill: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]",
        decorLine: "from-red-600 via-rose-600 to-amber-500",
      }
    : {
        logoGradient: "from-cyan-400 via-sky-400 to-violet-400",
        badge: "HUB",
        badgeBg: "bg-cyan-600/30 text-cyan-300 border-cyan-500/40",
        glowTop: "from-cyan-900/25",
        activeGradient: "from-cyan-600/30 to-sky-600/10",
        activeBorder: "border-cyan-500/30",
        activeText: "text-cyan-400",
        activeHover: "group-hover:text-cyan-300",
        activePill: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]",
        activeDot: "bg-cyan-500",
        searchBorderHover: "hover:border-cyan-500/50",
        searchIcon: "text-cyan-400",
        berandaActive: "shadow-cyan-950/40 from-cyan-600/30 to-sky-600/10 border-cyan-500/30",
        berandaIcon: "text-cyan-400",
        berandaHoverIcon: "group-hover:text-cyan-300",
        berandaPill: "bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]",
        decorLine: "from-cyan-500 via-sky-400 to-violet-500",
      };

  const getActiveCategory = () => {
    const idx = menuCategories.findIndex(cat => 
      cat.items.some(item => item.path === location.pathname)
    );
    return idx !== -1 ? idx : -1;
  };

  const [expandedCats, setExpandedCats] = useState(() => {
    const active = getActiveCategory();
    return active !== -1 ? [active] : [0];
  });

  useEffect(() => {
    const activeIdx = getActiveCategory();
    if (activeIdx !== -1 && !expandedCats.includes(activeIdx)) {
      setExpandedCats(prev => [...prev, activeIdx]);
    }
  }, [location.pathname]);

  // Reset expanded categories when mode changes
  useEffect(() => {
    setExpandedCats([0]);
  }, [isAdultMode]);

  const toggleCategory = (idx) => {
    setExpandedCats(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]/95 backdrop-blur-2xl border-r border-white/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className={`absolute top-0 left-0 w-full h-56 bg-gradient-to-b ${accent.glowTop} to-transparent blur-[80px] pointer-events-none`} />

      <div className="p-6 pb-3 z-10 shrink-0">
        <div className="flex justify-between items-center mb-5">
          <Link to="/" onClick={onClose} className="group">
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${accent.logoGradient} group-hover:brightness-125 transition-all duration-300`}>
                ApiCos
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={accent.badge}
                  initial={{ opacity: 0, scale: 0.7, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.7, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border tracking-wider ${accent.badgeBg}`}
                >
                  {accent.badge}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className={`h-1 w-10 bg-gradient-to-r ${accent.decorLine} rounded-full mt-1.5 group-hover:w-full transition-all duration-500`} />
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Global Search Quick Trigger */}
        <button
          onClick={() => {
            onOpenSearch?.();
            onClose?.();
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 ${accent.searchBorderHover} text-gray-300 hover:text-white transition-all shadow-inner group cursor-pointer mb-2`}
        >
          <div className="flex items-center gap-2.5">
            <Search size={16} className={`${accent.searchIcon} group-hover:scale-110 transition-transform`} />
            <span className="text-xs font-medium">Cari di semua platform...</span>
          </div>
          <kbd className={`text-[10px] bg-black/60 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono group-hover:border-white/20 transition-colors`}>
            Ctrl+K
          </kbd>
        </button>

        {/* Standalone Pinned Beranda */}
        <Link
          to="/"
          onClick={onClose}
          className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
            location.pathname === "/"
              ? `text-white shadow-lg ${accent.berandaActive} font-semibold`
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span
            className={`relative z-10 transition-transform duration-300 ${location.pathname === "/" ? `${accent.berandaIcon} scale-110` : `group-hover:scale-110 ${accent.berandaHoverIcon}`}`}
          >
            <Home size={20} />
          </span>
          <span
            className={`tracking-wide relative z-10 text-sm ${location.pathname === "/" ? "text-white font-medium" : ""}`}
          >
            Beranda
          </span>

          {location.pathname === "/" && (
            <motion.div
              layoutId="active-pill"
              className={`absolute right-3 w-2 h-2 rounded-full ${accent.berandaPill}`}
            />
          )}
        </Link>
      </div>

      <div className="h-px bg-white/5 mx-6 mb-3 shrink-0" />

      <div className="flex-1 overflow-y-auto px-5 space-y-6 pb-6 z-10 custom-scrollbar">
        {menuCategories.map((category, idx) => {
          const isExpanded = expandedCats.includes(idx);
          const hasActiveItem = category.items.some(item => item.path === location.pathname);

          return (
            <div key={category.title} className="flex flex-col">
              <button
                onClick={() => toggleCategory(idx)}
                className={`flex items-center justify-between w-full text-left mb-2.5 transition-colors duration-200 group ${hasActiveItem ? accent.activeText : "text-gray-400 hover:text-white"}`}
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasActiveItem ? accent.activeDot : "bg-gray-600"}`} />
                  {category.title}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={14} className={hasActiveItem ? accent.activeText : "text-gray-500 group-hover:text-white"} />
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
                    <div className="space-y-1.5 pt-1 pb-2">
                      {category.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
                              isActive
                                ? `text-white shadow-lg bg-gradient-to-r ${accent.activeGradient} ${accent.activeBorder} border font-semibold`
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span
                              className={`relative z-10 transition-transform duration-300 ${isActive ? `${accent.activeText} scale-110` : `group-hover:scale-110 ${accent.activeHover}`}`}
                            >
                              {item.icon}
                            </span>
                            <span
                              className={`tracking-wide relative z-10 text-sm ${isActive ? "text-white" : ""}`}
                            >
                              {item.name}
                            </span>

                            {isActive && (
                              <motion.div
                                layoutId="active-pill"
                                className={`absolute right-3 w-2 h-2 rounded-full ${accent.activePill}`}
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

      {/* ── Bottom: Mode Switcher + Status ──────────────────────────── */}
      <div className="mt-auto border-t border-white/5 bg-black/20 shrink-0 z-10">
        {/* Mode Switcher Button */}
        <div className="px-4 pt-4 pb-2">
          <motion.button
            onClick={togglePortalMode}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`w-full relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500 overflow-hidden group ${
              isAdultMode
                ? "bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border-cyan-500/20 hover:border-cyan-400/40"
                : "bg-gradient-to-r from-rose-950/60 to-neutral-950/60 border-rose-500/20 hover:border-rose-400/40"
            }`}
          >
            {/* Glow effect on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
              isAdultMode
                ? "bg-gradient-to-r from-cyan-500/[0.08] to-violet-500/[0.05]"
                : "bg-gradient-to-r from-rose-500/[0.08] to-red-500/[0.05]"
            }`} />

            <AnimatePresence mode="wait">
              <motion.div
                key={isAdultMode ? "to-general" : "to-adult"}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center ${
                  isAdultMode
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {isAdultMode ? <Globe size={16} /> : <Shield size={16} />}
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
                  className={`text-xs font-bold ${
                    isAdultMode ? "text-cyan-200" : "text-rose-200"
                  }`}
                >
                  {isAdultMode ? "Mode Anime & Film" : "Mode ApiCos Cinema"}
                </motion.span>
              </AnimatePresence>
              <span className="text-[10px] text-gray-500">Klik untuk beralih mode</span>
            </div>

            {/* Arrow indicator */}
            <div className={`relative z-10 ml-auto text-gray-500 group-hover:translate-x-0.5 transition-transform ${
              isAdultMode ? "group-hover:text-cyan-400" : "group-hover:text-rose-400"
            }`}>
              <ChevronDown size={14} className="-rotate-90" />
            </div>
          </motion.button>
        </div>

        {/* System Status */}
        <div className="px-6 pb-4 pt-1">
          <div className="flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
              <span>SYSTEM ONLINE</span>
            </div>
            <span className="text-[10px] text-gray-600">v2.1</span>
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
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md"
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={sidebarVariants}
                className="fixed left-0 top-0 h-full w-72 z-[60] shadow-2xl"
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
