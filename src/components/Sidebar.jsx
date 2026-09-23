import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, Image, Book, Camera, Video, Menu, Heart, Sparkles, Film, Search, Home } from "lucide-react";

const menuCategories = [
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

const SidebarContent = ({ onClose, location, onOpenSearch }) => {
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

  const toggleCategory = (idx) => {
    setExpandedCats(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b]/95 backdrop-blur-2xl border-r border-white/5 relative overflow-hidden">
      {/* Decorative Red Cinema Glow */}
      <div className="absolute top-0 left-0 w-full h-56 bg-gradient-to-b from-rose-900/25 to-transparent blur-[80px] pointer-events-none" />

      <div className="p-6 pb-3 z-10 shrink-0">
        <div className="flex justify-between items-center mb-5">
          <Link to="/" onClick={onClose} className="group">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 group-hover:brightness-125 transition-all duration-300">
                ApiCos
              </span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/40 tracking-wider">
                CINEMA
              </span>
            </div>
            <div className="h-1 w-10 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-full mt-1.5 group-hover:w-full transition-all duration-500" />
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
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-red-500/50 text-gray-300 hover:text-white transition-all shadow-inner group cursor-pointer mb-2"
        >
          <div className="flex items-center gap-2.5">
            <Search size={16} className="text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">Cari di semua platform...</span>
          </div>
          <kbd className="text-[10px] bg-black/60 border border-white/10 px-1.5 py-0.5 rounded text-gray-400 font-mono group-hover:text-red-300 group-hover:border-red-500/30 transition-colors">
            Ctrl+K
          </kbd>
        </button>

        {/* Standalone Pinned Beranda */}
        <Link
          to="/"
          onClick={onClose}
          className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden ${
            location.pathname === "/"
              ? "text-white shadow-lg shadow-rose-950/40 bg-gradient-to-r from-red-600/30 to-rose-600/10 border border-red-500/30 font-semibold"
              : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <span
            className={`relative z-10 transition-transform duration-300 ${location.pathname === "/" ? "text-red-400 scale-110" : "group-hover:scale-110 group-hover:text-red-300"}`}
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
              className="absolute right-3 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]"
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
                className={`flex items-center justify-between w-full text-left mb-2.5 transition-colors duration-200 group ${hasActiveItem ? "text-red-400" : "text-gray-400 hover:text-white"}`}
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${hasActiveItem ? "bg-red-500" : "bg-gray-600"}`} />
                  {category.title}
                </span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={14} className={hasActiveItem ? "text-red-400" : "text-gray-500 group-hover:text-white"} />
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
                                ? "text-white shadow-lg shadow-rose-950/40 bg-gradient-to-r from-red-600/30 to-rose-600/10 border border-red-500/30 font-semibold"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span
                              className={`relative z-10 transition-transform duration-300 ${isActive ? "text-red-400 scale-110" : "group-hover:scale-110 group-hover:text-red-300"}`}
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
                                className="absolute right-3 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]"
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

      <div className="mt-auto p-6 border-t border-white/5 bg-black/20 shrink-0 z-10">
        <div className="flex items-center justify-between opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <span>SYSTEM ONLINE</span>
          </div>
          <span className="text-[10px] text-gray-600">v2.0</span>
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
