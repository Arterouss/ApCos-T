import React from "react";

export default function TagList({ tags, onTagClick }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider mr-2">
        Trending:
      </span>
      {tags.slice(0, 8).map((tag) => (
        <button
          key={tag.label || tag.tag}
          onClick={() => onTagClick(tag.label || tag.tag)}
          className="text-xs bg-black/20 hover:bg-violet-500/20 text-gray-400 hover:text-violet-300 px-3 py-1 rounded-full transition-colors border border-white/5"
        >
          #{tag.label || tag.tag}
        </button>
      ))}
    </div>
  );
}
