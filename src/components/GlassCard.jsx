import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bug } from "lucide-react";

/**
 * A reusable Glassmorphic Card component.
 *
 * Props:
 * - to: Link destination
 * - title: Title of the item
 * - thumb: Thumbnail URL
 * - category: Category label
 * - subtitle: Optional subtitle/meta info
 * - fallbackIcon: Icon to show if no thumbnail
 */
const GlassCard = ({
  to,
  title,
  thumb,
  category,
  subtitle,
  fallbackIcon: FallbackIcon = Bug,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group flex flex-col rounded-xl overflow-hidden glass-panel hover:border-violet-500/40 transition-all duration-300 bg-neutral-900/40 hover:shadow-xl hover:shadow-violet-500/10"
    >
      <Link to={to} className="block relative aspect-[2/3] overflow-hidden w-full bg-neutral-900">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 ease-in-out"
            loading="lazy"
            onError={(e) => {
              if (!e.target.dataset.proxied && thumb.startsWith("http")) {
                e.target.dataset.proxied = "true";
                e.target.src = `/api/proxy?url=${encodeURIComponent(thumb)}&referer=https://jav.guru/`;
              } else {
                e.target.style.display = "none";
                e.target.parentElement.classList.add(
                  "flex",
                  "items-center",
                  "justify-center",
                  "bg-neutral-900"
                );
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/50 text-gray-600">
            <FallbackIcon size={32} className="mb-2 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}

        {/* Hover Overlay with Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-[11px] text-gray-200 line-clamp-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            {title}
          </p>
        </div>

        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-sm z-10 max-w-[85%] truncate">
            {category}
          </div>
        )}
      </Link>

      {/* Content always visible for clean aesthetics */}
      <div className="p-2.5 sm:p-3 bg-neutral-900/80 backdrop-blur-sm border-t border-white/5 flex-1 flex flex-col justify-between">
        <h3
          className="text-xs sm:text-sm font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors"
          title={title}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-gray-400 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default GlassCard;
