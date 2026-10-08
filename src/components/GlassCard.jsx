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
    <div
      className="glass-card group flex flex-col rounded-2xl overflow-hidden transition-transform duration-200 active:scale-98 md:hover:-translate-y-1.5 border border-white/10"
    >
      <Link to={to} className="block relative aspect-[2/3] overflow-hidden w-full" style={{ background: '#0c0c14' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform md:group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              if (!e.target.dataset.proxied && thumb.startsWith("http")) {
                e.target.dataset.proxied = "true";
                e.target.src = `/api/proxy?url=${encodeURIComponent(thumb)}&referer=https://jav.guru/`;
              } else {
                e.target.style.display = "none";
                e.target.parentElement.classList.add(
                  "flex",
                  "items-center",
                  "justify-center"
                );
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-700" style={{ background: 'rgba(14,14,22,0.8)' }}>
            <FallbackIcon size={32} className="mb-2 opacity-40" />
            <span className="text-[10px] opacity-50">No Image</span>
          </div>
        )}

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-3">
          <p className="text-[11px] text-gray-200 line-clamp-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-400">
            {title}
          </p>
        </div>

        {/* Category Badge — frosted glass */}
        {category && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white z-10 max-w-[85%] truncate bg-black/75 border border-white/10"
          >
            {category}
          </div>
        )}
      </Link>

      {/* Content section */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between" style={{
        background: 'rgba(10, 10, 16, 0.8)',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        <h3
          className="text-xs sm:text-sm font-semibold text-gray-100 line-clamp-2 leading-snug group-hover:text-[#ff2d55] transition-colors duration-300"
          title={title}
        >
          {title}
        </h3>
        {subtitle && (
          <p className="text-[10px] text-gray-500 mt-1 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default GlassCard;
