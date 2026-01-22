import React from "react";

const CATEGORIES = [
  { label: "🔥 Popular", tag: "sort:score:desc" },
  { label: "🎬 Video", tag: "video" },
  { label: "🧊 3D", tag: "3d" },
  { label: "🎨 2D", tag: "2d" },
  { label: "👾 GIF", tag: "animated_gif" },
  { label: "🖼️ Images", tag: "-video" },
];

export default function CategoryChips({ onTagClick }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.label}
          onClick={() => onTagClick(cat.tag)}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-all border border-white/5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10"
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
