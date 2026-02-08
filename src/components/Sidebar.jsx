import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { X, Users, Tv, Image, Book, Camera } from "lucide-react";

const menuItems = [
  { name: "E-Hentai", path: "/", icon: <Book size={20} /> },
  { name: "Bunkr", path: "/hanime", icon: <Tv size={20} /> },
  { name: "Rule34", path: "/rule34", icon: <Image size={20} /> },
  { name: "Cosplay Tele", path: "/cosplay", icon: <Camera size={20} /> },
];

const SidebarContent = ({ onClose, location }) => (
  <div className="p-6 h-full flex flex-col">
    <div className="flex justify-between items-center mb-12">
      <h2 className="text-3xl font-extrabold tracking-tighter">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
          Api
        </span>
        <span className="text-white">Cos</span>
      </h2>
      {/* Close button only for mobile/drawer mode */}
      <button
        onClick={onClose}
        className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
      >
        <X size={24} />
      </button>
    </div>

    <div className="space-y-3">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onClose}
            className={`relative flex items-center gap-4 px-4 py-3.5 rounded-r-xl transition-all duration-300 group overflow-hidden ${
              isActive
                ? "bg-white/5 text-white border-l-4 border-violet-500"
                : "text-gray-400 hover:text-white hover:bg-white/5 hover:pl-6"
            }`}
          >
            {/* Glow Effect for Active */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
            )}

            <span
              className={`relative z-10 transition-transform ${
                isActive ? "scale-110" : "group-hover:scale-110"
              }`}
            >
              {item.icon}
            </span>
            <span className="font-semibold tracking-wide relative z-10 text-sm">
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>

    <div className="mt-auto pt-8 border-t border-white/5">
      <div className="flex items-center justify-center gap-2 opacity-50 text-[10px] text-gray-400">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span>System Operational</span>
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
                className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              />
              <motion.div
                initial="closed"
                animate="open"
                exit="closed"
                variants={sidebarVariants}
                className="fixed left-0 top-0 h-full w-72 bg-black/80 backdrop-blur-2xl z-[60] shadow-2xl border-r border-white/5"
              >
                <SidebarContent onClose={onClose} location={location} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Static Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-72 bg-neutral-900/50 backdrop-blur-xl border-r border-white/5 z-40">
        <SidebarContent onClose={onClose} location={location} />
      </div>
    </>
  );
};

export default Sidebar;
