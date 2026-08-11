import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, ChevronDown, Image, Book, Camera, Box, Video, Sparkles, Film } from "lucide-react";

const menuCategories = [
  {
    title: "Manga & Doujin",
    items: [
      { name: "Nhentai", path: "/nhentai", icon: <Sparkles size={20} /> },
      { name: "Doujin Desu", path: "/doujin", icon: <Book size={20} /> },
    ]
  },
  {
    title: "Video Dewasa",
    items: [
      { name: "Jav.Guru", path: "/hanimetv", icon: <Film size={20} /> },
      { name: "PornavHD", path: "/hanime", icon: <Film size={20} /> },
      { name: "Iwara TV", path: "/oreno3d", icon: <Box size={20} /> },
      { name: "CavPorn", path: "/cavporn", icon: <Video size={20} /> },
      { name: "Rule34", path: "/rule34", icon: <Image size={20} /> },
    ]
  },
  {
    title: "Cosplay & Image",
    items: [
      { name: "Cosplay Tele", path: "/cosplay", icon: <Camera size={20} /> },
    ]
  }
];

const SidebarContent = ({ onClose, location }) => {
  const getActiveCategory = () => {
    const idx = menuCategories.findIndex(cat => 
      cat.items.some(item => item.path === location.pathname)
    );
    return idx !== -1 ? idx : 0;
  };

  const [expandedCats, setExpandedCats] = useState([getActiveCategory()]);

  useEffect(() => {
    const activeIdx = getActiveCategory();
    if (!expandedCats.includes(activeIdx)) {
      setExpandedCats(prev => [...prev, activeIdx]);
    }
  }, [location.pathname]);

  const toggleCategory = (idx) => {
    setExpandedCats(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-neutral-900/90 to-black/90 backdrop-blur-xl border-r border-white/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-full h-48 bg-violet-600/20 blur-[100px] pointer-events-none" />

      <div className="p-8 pb-4 z-10 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" onClick={onClose} className="group">
            <h2 className="text-3xl font-extrabold tracking-tighter">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-violet-400 transition-all duration-500">
                Api
              </span>
              <span className="text-white group-hover:text-fuchsia-300 transition-colors duration-300">
                Cos
              </span>
            </h2>
            <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full mt-1 group-hover:w-full transition-all duration-500" />
          </Link>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-6 z-10 custom-scrollbar">
        {menuCategories.map((category, idx) => {
          const isExpanded = expandedCats.includes(idx);
          const hasActiveItem = category.items.some(item => item.path === location.pathname);

          return (
            <div key={category.title} className="flex flex-col">
              <button
                onClick={() => toggleCategory(idx)}
                className={`flex items-center justify-between w-full text-left mb-3 transition-colors duration-200 group ${hasActiveItem ? "text-fuchsia-400" : "text-gray-400 hover:text-white"}`}
              >
                <span className="text-xs font-bold uppercase tracking-widest">{category.title}</span>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={14} className={hasActiveItem ? "text-fuchsia-400" : "text-gray-500 group-hover:text-white"} />
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
                    <div className="space-y-2 pt-1 pb-2">
                      {category.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            className={`relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden ${
                              isActive
                                ? "text-white shadow-lg shadow-violet-900/20 bg-white/10"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            {isActive && (
                              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/10 border border-white/5 rounded-xl" />
                            )}

                            <span
                              className={`relative z-10 transition-transform duration-300 ${isActive ? "text-fuchsia-300 scale-110" : "group-hover:scale-110 group-hover:text-fuchsia-100"}`}
                            >
                              {item.icon}
                            </span>
                            <span
                              className={`font-semibold tracking-wide relative z-10 text-sm ${isActive ? "text-white" : ""}`}
                            >
                              {item.name}
                            </span>

                            {isActive && (
                              <motion.div
                                layoutId="active-pill"
                                className="absolute right-3 w-1.5 h-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]"
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

const Sidebar = ({ isOpen, onClose }) => {
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
                <SidebarContent onClose={onClose} location={location} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Static Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-72 z-40">
        <SidebarContent onClose={onClose} location={location} />
      </div>
    </>
  );
};

export default Sidebar;
