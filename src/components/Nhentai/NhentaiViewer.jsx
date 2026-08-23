import React, { useEffect, useState, useRef, useCallback } from "react";
import { X, BookOpen, CheckCircle2, SkipForward, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchNhentaiDetail } from "../../services/nhentaiService";

const AUTO_ADVANCE_SECONDS = 5;

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

export default function NhentaiViewer({ gallery, galleries = [], currentIdx = -1, onNavigate, onClose }) {
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showUI,   setShowUI]   = useState(true);
  const [finished, setFinished] = useState(() => isNhentaiRead(gallery.id));
  const [countdown, setCountdown] = useState(null);

  const lastScrollY        = useRef(0);
  const scrollContainerRef = useRef(null);
  const sentinelRef        = useRef(null);
  const timerRef           = useRef(null);

  // Compute next / prev gallery
  const nextGallery = currentIdx >= 0 && currentIdx < galleries.length - 1 ? galleries[currentIdx + 1] : null;
  const prevGallery = currentIdx > 0 ? galleries[currentIdx - 1] : null;

  const handleClose = useCallback(() => {
    window.dispatchEvent(new Event("nhentai-read-update"));
    onClose();
  }, [onClose]);

  const goToGallery = useCallback((g, idx) => {
    clearTimeout(timerRef.current);
    window.scrollTo(0, 0);
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    onNavigate(g, idx);
  }, [onNavigate]);

  // Load detail
  useEffect(() => {
    document.body.style.overflow = "hidden";
    setDetail(null);
    setLoading(true);
    setError(null);
    setFinished(isNhentaiRead(gallery.id));
    setCountdown(null);
    clearTimeout(timerRef.current);

    fetchNhentaiDetail(gallery.id)
      .then(d => setDetail(d))
      .catch(() => setError("Gagal memuat detail manga"))
      .finally(() => setLoading(false));

    return () => { document.body.style.overflow = "auto"; };
  }, [gallery.id]);

  // Keyboard close
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight" && nextGallery) goToGallery(nextGallery, currentIdx + 1);
      if (e.key === "ArrowLeft"  && prevGallery) goToGallery(prevGallery, currentIdx - 1);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleClose, goToGallery, nextGallery, prevGallery, currentIdx]);

  // Intersection Observer – marks gallery as read when sentinel is visible
  useEffect(() => {
    if (!sentinelRef.current || finished) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setFinished(true);
        markNhentaiRead(gallery.id);
        if (nextGallery) setCountdown(AUTO_ADVANCE_SECONDS);
      },
      { threshold: 0.5 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, gallery.id]);

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { goToGallery(nextGallery, currentIdx + 1); return; }
    timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown, nextGallery, currentIdx, goToGallery]);

  const handleScroll = (e) => {
    const y = e.target.scrollTop;
    if (y > lastScrollY.current + 20)      setShowUI(false);
    else if (y < lastScrollY.current - 50) setShowUI(true);
    lastScrollY.current = y;
  };

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
            {finished && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
          </h2>
          <div className="text-white/70 text-xs mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1"><BookOpen size={12}/> {detail.num_pages} Pages</span>
            {currentIdx >= 0 && galleries.length > 0 && (
              <span className="text-gray-500">{currentIdx + 1} / {galleries.length}</span>
            )}
            {finished && <span className="text-emerald-400 font-semibold">✅ Selesai</span>}
          </div>
        </div>

        {/* Prev / Next buttons in header */}
        <div className="flex items-center gap-1 mr-2">
          {prevGallery && (
            <button onClick={() => goToGallery(prevGallery, currentIdx - 1)}
              className="p-1.5 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white border border-white/10" title="Galeri Sebelumnya (←)">
              <ChevronLeft size={16} />
            </button>
          )}
          {nextGallery && (
            <button onClick={() => goToGallery(nextGallery, currentIdx + 1)}
              className="p-1.5 bg-black/50 hover:bg-white/20 rounded-full transition-colors text-white border border-white/10" title="Galeri Berikutnya (→)">
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        <button onClick={handleClose}
          className="p-2 bg-black/50 hover:bg-red-500/80 rounded-full transition-colors text-white backdrop-blur-md border border-white/10">
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
              <div key={index} className="w-full relative min-h-[200px]" onClick={() => setShowUI(v => !v)}>
                <div className="absolute inset-0 flex justify-center items-center -z-10 bg-[#0a0a0a]">
                  <div className="w-8 h-8 rounded-full border-2 border-pink-500/10 border-t-pink-500/50 animate-spin" />
                </div>
                <img src={imageUrl} alt={`Page ${index + 1}`} loading="lazy"
                  className="w-full block h-auto object-contain select-none m-0 p-0" />
              </div>
            );
          })}

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />

          {/* ── End-of-gallery panel ──────────────────────────────────── */}
          {finished && (
            <div className="w-full px-4 pb-8 pt-2">
              <div className="rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur overflow-hidden shadow-2xl">
                {/* Read badge */}
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-white/5">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <p className="text-emerald-300 font-semibold text-sm">Galeri selesai dibaca!</p>
                </div>

                {nextGallery ? (
                  <div className="p-5">
                    <p className="text-gray-400 text-xs mb-1 flex items-center gap-1.5">
                      <SkipForward size={13} className="text-pink-400" />
                      Berikutnya ({currentIdx + 2}/{galleries.length}):
                    </p>
                    <p className="text-white text-sm font-semibold mb-4 line-clamp-1">
                      {nextGallery.english_title || nextGallery.japanese_title || "Galeri berikutnya"}
                    </p>

                    {/* Countdown bar */}
                    {countdown !== null && (
                      <div className="mb-4">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-1000"
                            style={{ width: `${((AUTO_ADVANCE_SECONDS - countdown) / AUTO_ADVANCE_SECONDS) * 100}%` }}
                          />
                        </div>
                        <p className="text-right text-pink-300 text-xs mt-1">{countdown}s</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => goToGallery(nextGallery, currentIdx + 1)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-pink-500/20 hover:scale-[1.02]"
                      >
                        <BookOpen size={16} /> Baca Galeri Berikutnya <ChevronRight size={16} />
                      </button>
                      {countdown !== null && (
                        <button
                          onClick={() => { clearTimeout(timerRef.current); setCountdown(null); }}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-all"
                        >
                          Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center">
                    <p className="text-gray-300 font-semibold mb-1">🎉 Semua galeri sudah dibaca!</p>
                    <p className="text-gray-500 text-xs mb-4">Tidak ada galeri lagi di halaman ini.</p>
                    <button onClick={handleClose}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium transition-all">
                      Tutup
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className={`fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-20 flex justify-center transition-all duration-300 pointer-events-none ${showUI ? "opacity-100" : "opacity-0 translate-y-full"}`}>
        <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[10px] sm:text-xs text-white/70">
          Scroll ke bawah untuk sembunyikan UI • ← → untuk navigasi galeri
        </div>
      </div>
    </div>
  );
}
