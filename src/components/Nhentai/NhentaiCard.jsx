import React from "react";
import { BookOpen, Heart } from "lucide-react";

export default function NhentaiCard({ gallery, onClick }) {
  const rawThumbUrl = `https://t.nhentai.net/${gallery.thumbnail}`;
  const thumbUrl = `/api/nhentai/image?url=${encodeURIComponent(rawThumbUrl)}`;
  
  const title = gallery.english_title || gallery.japanese_title || "Unknown Title";

  // Get first 3 tags for display (using resolved tags)
  const displayTags = gallery.tags 
    ? gallery.tags.slice(0, 3) 
    : [];

  return (
    <div
      onClick={() => onClick(gallery)}
      className="group relative bg-white/5 rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)] flex flex-col h-full"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
        <img
          src={thumbUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
        
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1.5 border border-white/10">
          <BookOpen size={12} className="text-pink-400" />
          <span className="text-xs font-bold text-white">{gallery.num_pages}</span>
        </div>
        
        {gallery.num_favorites > 0 && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 border border-white/10">
            <Heart size={12} className="text-pink-500 fill-pink-500" />
            <span className="text-xs font-bold text-white">{gallery.num_favorites}</span>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-white line-clamp-2 mb-2 group-hover:text-pink-400 transition-colors">
          {title}
        </h3>
        
        <div className="mt-auto flex flex-wrap gap-1">
          {displayTags.map((tag) => (
            <span 
              key={tag.id || tag}
              className="text-[10px] px-1.5 py-0.5 rounded-sm bg-pink-500/20 text-pink-300 border border-pink-500/20"
            >
              {tag.name || tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
