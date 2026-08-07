import React from "react";
import { Play } from "lucide-react";

export default function Rule34VideoCard({ video, onClick }) {
  if (!video) return null;

  return (
    <div
      onClick={() => onClick(video)}
      className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/5 hover:border-violet-500/50 transition-all cursor-pointer shadow-lg hover:shadow-violet-500/20"
    >
      <div className="aspect-[4/3] w-full bg-neutral-800 relative overflow-hidden">
        {video.image_url ? (
          <img
            src={video.image_url}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-violet-600/90 text-white flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300">
            <Play size={24} className="ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
            {video.duration}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="text-white text-sm sm:text-base font-bold line-clamp-2 leading-tight group-hover:text-violet-400 transition-colors">
          {video.title}
        </h3>
      </div>
    </div>
  );
}
