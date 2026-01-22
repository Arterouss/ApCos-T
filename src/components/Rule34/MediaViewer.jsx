import React from "react";
import { X, Image as ImageIcon, Download } from "lucide-react";

export default function MediaViewer({ post, onClose, onTagClick }) {
  if (!post) return null;

  const isVideo =
    post.file_url.endsWith(".mp4") ||
    post.file_url.endsWith(".webm") ||
    post.tags.includes("video");

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors backdrop-blur-md"
      >
        <X size={24} />
      </button>

      <div className="max-w-6xl w-full max-h-[90vh] flex flex-col items-center p-1 overflow-y-auto">
        {isVideo ? (
          <video
            src={post.file_url}
            poster={post.sample_url || post.preview_url}
            controls
            autoPlay
            loop
            referrerPolicy="no-referrer"
            className="max-h-[80vh] min-h-[50vh] w-full rounded-2xl shadow-2xl bg-black border border-white/10 shrink-0"
          />
        ) : (
          <img
            src={post.file_url}
            referrerPolicy="no-referrer"
            alt="Content"
            className="max-h-[80vh] min-h-[50vh] w-full object-contain rounded-2xl shadow-2xl border border-white/10 shrink-0"
          />
        )}

        <div className="mt-6 w-full flex flex-col md:flex-row justify-between items-start gap-4 text-gray-300 bg-black/40 backdrop-blur-xl p-4 rounded-xl border border-white/5">
          <div className="flex flex-wrap gap-2 flex-1">
            {post.tags
              .split(" ")
              .slice(0, 15)
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onClose();
                    onTagClick(tag);
                  }}
                  className="text-xs bg-white/5 hover:bg-violet-600 text-gray-300 hover:text-white px-3 py-1.5 rounded-full cursor-pointer transition-all border border-white/5"
                >
                  {tag}
                </button>
              ))}
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href={post.file_url}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600/80 hover:bg-blue-600 px-4 py-2 rounded-lg text-white font-medium text-sm flex items-center gap-2 backdrop-blur-sm transition-colors"
            >
              <ImageIcon size={16} /> Source
            </a>
            <a
              href={post.file_url}
              download
              target="_blank"
              referrerPolicy="no-referrer"
              className="flex items-center gap-2 bg-emerald-600/80 hover:bg-emerald-600 px-4 py-2 rounded-lg text-white font-medium text-sm backdrop-blur-sm transition-colors"
            >
              <Download size={16} /> Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
