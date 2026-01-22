import React from "react";
import { Play, Image as ImageIcon } from "lucide-react";

export default function PostCard({ post, onClick }) {
  const isVideo = post.tags.includes("video");

  return (
    <div
      onClick={() => onClick(post)}
      className="relative aspect-[2/3] group rounded-2xl overflow-hidden bg-white/5 border border-white/5 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:border-violet-500/50 transition-all duration-500"
    >
      <img
        src={post.preview_url}
        referrerPolicy="no-referrer"
        alt={post.tags}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
        <div className="flex flex-wrap gap-1.5 mb-3 max-h-24 overflow-hidden">
          {post.tags
            .split(" ")
            .slice(0, 4)
            .map((tag, idx) => (
              <span
                key={`${tag}-${idx}`}
                className="text-[10px] bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded text-white font-medium"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-2">
          <span className="text-xs font-bold text-violet-300">
            ★ {post.score}
          </span>
          <span
            className={`p-2 rounded-full text-white shadow-lg ${
              isVideo ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {isVideo ? (
              <Play size={12} fill="currentColor" />
            ) : (
              <ImageIcon size={12} />
            )}
          </span>
        </div>
      </div>

      {/* Type Indicator (Always Visible) */}
      {isVideo && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5 border border-white/10 shadow-lg">
          <Play size={10} fill="currentColor" /> Play
        </div>
      )}
    </div>
  );
}
