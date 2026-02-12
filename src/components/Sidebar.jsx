import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, Users, Tv, Image, Book, Camera, Cat, Video } from "lucide-react";

const menuItems = [
  { name: "E-Hentai", path: "/", icon: <Book size={20} /> },
  { name: "Bunkr", path: "/hanime", icon: <Tv size={20} /> },
  { name: "Nekopoi", path: "/nekopoi", icon: <Cat size={20} /> },
  { name: "Rule34", path: "/rule34", icon: <Image size={20} /> },
  { name: "Cosplay Tele", path: "/cosplay", icon: <Camera size={20} /> },
  { name: "CavPorn", path: "/cavporn", icon: <Video size={20} /> },
];

const SidebarContent = ({ onClose, location }) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-neutral-900/90 to-black/90 backdrop-blur-xl border-r border-white/5 relative overflow-hidden">
    {/* Decorative Glow */}
    <div className="absolute top-0 left-0 w-full h-48 bg-violet-600/20 blur-[100px] pointer-events-none" />

    <div className="p-8 pb-4 z-10">
      <div className="flex justify-between items-center mb-10">
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

      <div className="space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClose}
              className={`relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group overflow-hidden ${
                isActive
                  ? "text-white shadow-lg shadow-violet-900/20"
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
    </div>

    <div className="mt-auto p-6 border-t border-white/5 bg-black/20">
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
