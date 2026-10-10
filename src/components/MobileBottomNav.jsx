import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Search, Heart, Shield, Globe, Menu, Sparkles } from "lucide-react";
import { usePortalMode } from "../context/PortalContext";

export default function MobileBottomNav({ onOpenSidebar, onOpenSearch }) {
  const location = useLocation();
  const { isAdultMode, togglePortalMode } = usePortalMode();

  const neon = isAdultMode ? "#ff2d55" : "#00e5ff";
  const neonGlow = isAdultMode
    ? "rgba(255, 45, 85, 0.4)"
    : "rgba(0, 229, 255, 0.4)";

  const isHome = location.pathname === "/";
  const isFavorites = location.pathname === "/favorites" || location.pathname === "/bookmark-anime";

  // Sembunyikan bottom navigation saat membaca manga/manhwa agar tidak menghalangi panel bacaan
  if (location.pathname.startsWith("/doujin/chapter")) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 transition-all duration-300"
      style={{
        background: "rgba(8, 8, 12, 0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.6)",
        paddingBottom: "max(0.4rem, env(safe-area-inset-bottom, 0.4rem))",
      }}
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {/* 1. Beranda */}
        <Link
          to="/"
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            isHome ? "text-white" : "text-gray-400 hover:text-white"
          }`}
          style={{ minWidth: "56px" }}
        >
          {isHome && (
            <motion.div
              layoutId="mobile-nav-pill"
              className="absolute -top-1.5 w-6 h-1 rounded-full"
              style={{
                background: neon,
                boxShadow: `0 0 10px ${neonGlow}`,
              }}
            />
          )}
          <Home
            size={20}
            style={{ color: isHome ? neon : "currentColor" }}
            className="transition-transform active:scale-90"
          />
          <span
            className="text-[10px] font-bold tracking-tight"
            style={{ color: isHome ? neon : "inherit" }}
          >
            Beranda
          </span>
        </Link>

        {/* 2. Cari Global */}
        <button
          onClick={onOpenSearch}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-gray-400 hover:text-white transition-all cursor-pointer"
          style={{ minWidth: "56px" }}
          aria-label="Cari Cepat"
        >
          <Search size={20} className="transition-transform active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight">Cari</span>
        </button>

        {/* 3. Ganti Mode (Cinema / HUB) Center Highlight */}
        <button
          onClick={togglePortalMode}
          className="relative -top-2 flex flex-col items-center group cursor-pointer"
          aria-label="Ganti Portal Mode"
          title={`Beralih ke ${isAdultMode ? "Mode Anime HUB" : "Mode Cinema 18+"}`}
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 group-active:scale-90"
            style={{
              background: `linear-gradient(135deg, ${neon}, ${isAdultMode ? "#ff6b35" : "#7c4dff"})`,
              boxShadow: `0 4px 20px ${neonGlow}`,
            }}
          >
            {isAdultMode ? (
              <Shield size={20} className="text-white fill-white/20" />
            ) : (
              <Globe size={20} className="text-white fill-white/20" />
            )}
          </div>
          <span
            className="text-[9px] font-black tracking-wider uppercase mt-1 px-1.5 py-0.2 rounded-full"
            style={{
              color: neon,
              background: `${neon}15`,
            }}
          >
            {isAdultMode ? "CINEMA" : "HUB"}
          </span>
        </button>

        {/* 4. Favorit */}
        <Link
          to={isAdultMode ? "/favorites" : "/bookmark-anime"}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer ${
            isFavorites ? "text-white" : "text-gray-400 hover:text-white"
          }`}
          style={{ minWidth: "56px" }}
        >
          {isFavorites && (
            <motion.div
              layoutId="mobile-nav-pill"
              className="absolute -top-1.5 w-6 h-1 rounded-full"
              style={{
                background: neon,
                boxShadow: `0 0 10px ${neonGlow}`,
              }}
            />
          )}
          <Heart
            size={20}
            style={{ color: isFavorites ? neon : "currentColor" }}
            className={`transition-transform active:scale-90 ${isFavorites ? "fill-current" : ""}`}
          />
          <span
            className="text-[10px] font-bold tracking-tight"
            style={{ color: isFavorites ? neon : "inherit" }}
          >
            Favorit
          </span>
        </Link>

        {/* 5. Menu Drawer */}
        <button
          onClick={onOpenSidebar}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-gray-400 hover:text-white transition-all cursor-pointer"
          style={{ minWidth: "56px" }}
          aria-label="Buka Menu Lengkap"
        >
          <Menu size={20} className="transition-transform active:scale-90" />
          <span className="text-[10px] font-bold tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
