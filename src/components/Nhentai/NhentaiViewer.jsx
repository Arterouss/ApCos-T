import React, { useEffect, useState, useRef } from "react";
import { X, BookOpen, Settings } from "lucide-react";
import { fetchNhentaiDetail } from "../../services/nhentaiService";

export default function NhentaiViewer({ gallery, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUI, setShowUI] = useState(true);

  // Scroll tracking to auto-hide UI on scroll down
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    loadDetail();
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [gallery.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchNhentaiDetail(gallery.id);
      setDetail(data);
    } catch (err) {
      setError("Gagal memuat detail manga");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    
    // Auto hide UI when scrolling down
    if (currentScrollY > lastScrollY.current + 20) {
      setShowUI(false);
    } 
    // Show UI when scrolling up significantly
    else if (currentScrollY < lastScrollY.current - 50) {
      setShowUI(true);
    }
    
    lastScrollY.current = currentScrollY;
  };

  const toggleUI = () => {
    setShowUI(!showUI);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
        <div className="text-white text-center">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">Tutup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header UI - Absolute positioned to float over the reader */}
      <div 
        className={`absolute top-0 left-0 right-0 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-gradient-to-b from-black/90 to-transparent z-20 transition-transform duration-300 ${showUI ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-white font-bold truncate text-sm sm:text-base drop-shadow-md">
            {detail.title.english || detail.title.japanese}
          </h2>
          <div className="text-white/80 text-xs mt-0.5 flex items-center gap-3 drop-shadow-md">
            <span className="flex items-center gap-1"><BookOpen size={12}/> {detail.num_pages} Pages</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors text-white backdrop-blur-md border border-white/10"
        >
          <X size={20} />
        </button>
      </div>

      {/* Reader Area (Vertical Scroll) */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-[#050505]"
      >
        <div className="max-w-[800px] mx-auto w-full flex flex-col items-center">
          {detail.pages.map((page, index) => {
            const imageUrl = `https://i.nhentai.net/${page.path}`;
            return (
              <div 
                key={index} 
                className="w-full relative min-h-[200px]"
                onClick={toggleUI} // Tap on image to toggle UI
              >
                {/* Placeholder spinner while image loads */}
                <div className="absolute inset-0 flex justify-center items-center -z-10 bg-[#0a0a0a]">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/10 border-t-pink-500/50 animate-spin"></div>
                </div>
                
                <img
                  src={imageUrl}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  className="w-full block h-auto object-contain select-none m-0 p-0"
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Mobile Footer UI (Optional, just for "Tap to toggle" hint initially) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-center transition-transform duration-300 pointer-events-none ${showUI ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
      >
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] sm:text-xs text-white/70">
          Scroll down to hide UI • Tap image to toggle
        </div>
      </div>
    </div>
  );
}
