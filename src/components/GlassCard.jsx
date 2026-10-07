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
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-400"
      style={{
        background: 'rgba(14, 14, 22, 0.5)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.2)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(255, 45, 85, 0.06)';
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <Link to={to} className="block relative aspect-[2/3] overflow-hidden w-full" style={{ background: '#0c0c14' }}>
        {thumb ? (
          <img
            src={thumb}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
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
            className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white z-10 max-w-[85%] truncate"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
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
    </motion.div>
  );
};

export default GlassCard;
