import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  placeholder = "Cari judul, tag, atau kata kunci...",
  className = "",
  accentColor = "neon-red",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative w-full ${className}`}
    >
      <div className="relative group">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none transition-colors duration-300 text-gray-500 group-focus-within:text-neon-red">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2.5 sm:py-3 pl-10 pr-10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 transition-all duration-300 focus:outline-none"
          style={{
            background: 'rgba(18, 18, 28, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 45, 85, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 45, 85, 0.15), inset 0 0 10px rgba(255, 45, 85, 0.05)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-white transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default SearchBar;
