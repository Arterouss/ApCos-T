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
      className="group relative rounded-xl overflow-hidden glass-panel hover:border-violet-500/30 transition-all duration-300"
    >
      <Link to={to} className="block relative aspect-[2/3] overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add(
                "flex",
                "items-center",
                "justify-center",
                "bg-neutral-900",
              );
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900/50 text-gray-600">
            <FallbackIcon size={32} className="mb-2 opacity-50" />
            <span className="text-xs">No Image</span>
          </div>
        )}

        {/* Hover Overlay with Info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-xs text-gray-300 line-clamp-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            {title}
          </p>
        </div>

        {/* Category Badge */}
        {category && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm z-10">
            {category}
          </div>
        )}
      </Link>

      {/* Content for non-hover state (or always visible if mobile) */}
      <div className="p-3 bg-neutral-900/80 backdrop-blur-sm border-t border-white/5 absolute bottom-0 w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <h3
          className="text-sm font-medium text-gray-100 line-clamp-1"
          title={title}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

export default GlassCard;
