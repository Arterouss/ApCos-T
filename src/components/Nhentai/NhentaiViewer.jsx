import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, BookOpen, CheckCircle2 } from "lucide-react";
import { fetchNhentaiDetail } from "../../services/nhentaiService";

// ── Read progress stored in localStorage keyed by gallery id ─────────────
const READ_KEY = "nhentaiRead";
function getNhentaiRead() {
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); } catch { return new Set(); }
}
function markNhentaiRead(id) {
  try {
    const s = getNhentaiRead();
    s.add(String(id));
    localStorage.setItem(READ_KEY, JSON.stringify([...s]));
  } catch {}
}
export function isNhentaiRead(id) {
  return getNhentaiRead().has(String(id));
}

export default function NhentaiViewer({ gallery, onClose }) {
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showUI,   setShowUI]   = useState(true);
  const [finished, setFinished] = useState(() => isNhentaiRead(gallery.id));

  const handleClose = () => {
    window.dispatchEvent(new Event("nhentai-read-update"));
    onClose();
  };

  const lastScrollY       = useRef(0);
  const scrollContainerRef = useRef(null);
  const sentinelRef        = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    loadDetail();
    return () => { document.body.style.overflow = "auto"; };
  }, [gallery.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchNhentaiDetail(gallery.id);
      setDetail(data);
    } catch {
      setError("Gagal memuat detail manga");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Intersection Observer – marks gallery as read when sentinel (last page) is visible
  useEffect(() => {
    if (!sentinelRef.current || finished) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFinished(true);
          markNhentaiRead(gallery.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [detail, finished, gallery.id]);

  // Auto-hide header on scroll down
  const handleScroll = (e) => {
    const y = e.target.scrollTop;
    if (y > lastScrollY.current + 20)       setShowUI(false);
    else if (y < lastScrollY.current - 50)  setShowUI(true);
    lastScrollY.current = y;
  };

  const toggleUI = () => setShowUI(v => !v);

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm">
      <div className="w-12 h-12 rounded-full border-4 border-pink-500/30 border-t-pink-500 animate-spin" />
    </div>
  );

  if (error || !detail) return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={handleClose}>
      <div className="text-white text-center">
        <p className="text-xl text-red-400 mb-4">{error}</p>
        <button onClick={handleClose} className="px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20">Tutup</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 bg-gradient-to-b from-black/90 to-transparent z-20 transition-transform duration-300 ${showUI ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-white font-bold truncate text-sm sm:text-base drop-shadow-md flex items-center gap-2">
            {detail.title.english || detail.title.japanese}
            {finished && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" title="Sudah Dibaca" />}
          </h2>
          <div className="text-white/80 text-xs mt-0.5 flex items-center gap-3 drop-shadow-md">
            <span className="flex items-center gap-1"><BookOpen size={12}/> {detail.num_pages} Pages</span>
            {finished && <span className="text-emerald-400 font-semibold">✅ Selesai dibaca</span>}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors text-white backdrop-blur-md border border-white/10"
        >
          <X size={20} />
        </button>
      </div>

      {/* Reader Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth bg-[#050505]"
      >
        <div className="max-w-[800px] mx-auto w-full flex flex-col items-center">
          {detail.pages.map((page, index) => {
            const rawUrl   = `https://i.nhentai.net/${page.path}`;
            const imageUrl = `/api/nhentai/image?url=${encodeURIComponent(rawUrl)}`;
            return (
              <div key={index} className="w-full relative min-h-[200px]" onClick={toggleUI}>
                <div className="absolute inset-0 flex justify-center items-center -z-10 bg-[#0a0a0a]">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/10 border-t-pink-500/50 animate-spin" />
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

          {/* Sentinel for scroll-to-end detection */}
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />

          {/* Completion banner at the bottom */}
          {finished && (
            <div className="w-full px-4 pb-8 pt-2">
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={28} className="text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300 text-sm">Selesai Dibaca! 🎉</p>
                  <p className="text-gray-400 text-xs mt-0.5">Progress tersimpan di perangkat ini.</p>
                </div>
                <button
                  onClick={handleClose}
                  className="ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs text-white font-semibold transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className={`fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-center transition-all duration-300 pointer-events-none ${showUI ? "opacity-100" : "opacity-0 translate-y-full"}`}>
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] sm:text-xs text-white/70">
          Scroll down to hide UI • Tap image to toggle
        </div>
      </div>
    </div>
  );
}
