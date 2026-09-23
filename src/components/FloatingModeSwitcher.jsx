import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortalMode } from "../context/PortalContext";
import { Globe, Shield } from "lucide-react";

export default function FloatingModeSwitcher() {
  const { isAdultMode, togglePortalMode } = usePortalMode();

  return (
    <motion.button
      onClick={togglePortalMode}
      className="fixed bottom-6 right-6 z-[60] group"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Ganti Mode Portal"
    >
      <div
        className={`relative flex items-center gap-2.5 pl-3.5 pr-4 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          isAdultMode
            ? "bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 border-cyan-500/30 shadow-cyan-500/20 hover:border-cyan-400/50 hover:shadow-cyan-500/30"
            : "bg-gradient-to-r from-rose-950/80 to-neutral-950/80 border-rose-500/30 shadow-rose-500/20 hover:border-rose-400/50 hover:shadow-rose-500/30"
        }`}
      >
        {/* Glow ring */}
        <div
          className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            isAdultMode
              ? "shadow-[inset_0_0_20px_rgba(6,182,212,0.15)]"
              : "shadow-[inset_0_0_20px_rgba(244,63,94,0.15)]"
          }`}
        />

        {/* Icon with morph animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isAdultMode ? "globe" : "shield"}
            initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.3 }}
            className={`relative z-10 ${
              isAdultMode ? "text-cyan-400" : "text-rose-400"
            }`}
          >
            {isAdultMode ? <Globe size={17} /> : <Shield size={17} />}
          </motion.div>
        </AnimatePresence>

        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={isAdultMode ? "to-general" : "to-adult"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`relative z-10 text-xs font-bold tracking-wide whitespace-nowrap ${
              isAdultMode ? "text-cyan-200" : "text-rose-200"
            }`}
          >
            {isAdultMode ? "Mode Anime" : "Mode Cinema"}
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
