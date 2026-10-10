import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { getDoujinChapter, getDoujinDetail } from "../services/doujinService";
import { useReadProgress } from "../hooks/useReadProgress";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  BookOpen,
  SkipForward,
  Sparkles,
  Maximize2,
  Minimize2,
  ArrowUp,
  RefreshCw,
  Layers,
} from "lucide-react";

const AUTO_ADVANCE_SECONDS = 5;

export default function DoujinReaderPage() {
  const params = useParams();
  const chapter_id = params["*"] || "";
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapterList, setChapterList] = useState(location.state?.chapters || null);
  const [mangaSlug, setMangaSlug] = useState(location.state?.mangaSlug || null);

  // Full width mode (defaults to true for edge-to-edge full immersive reading)
  const [isFullWidth, setIsFullWidth] = useState(() => {
    try {
      return localStorage.getItem("doujin_full_width") !== "false";
    } catch {
      return true;
    }
  });

  // Native Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-hiding Controls (Navbar)
  const [showControls, setShowControls] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Read-to-bottom detection
  const [finishedReading, setFinishedReading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const sentinelRef = useRef(null);
  const timerRef = useRef(null);
  const lastScrollY = useRef(0);

  const { isRead, markRead } = useReadProgress(mangaSlug);
  const alreadyRead = isRead(chapter_id);

  // Toggle Full Width & persist
  const toggleFullWidth = (e) => {
    e?.stopPropagation?.();
    setIsFullWidth((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("doujin_full_width", String(next));
      } catch {}
      return next;
    });
  };

  // Toggle native Fullscreen
  const toggleFullscreen = (e) => {
    e?.stopPropagation?.();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Smart Scroll: Auto-hide header when scrolling down, reveal when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShowScrollTop(currentY > 500);

      if (currentY > lastScrollY.current + 30 && currentY > 120) {
        // Scrolling down -> hide controls for full immersion
        setShowControls(false);
      } else if (lastScrollY.current - currentY > 20 || currentY < 80) {
        // Scrolling up or near top -> show controls
        setShowControls(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top handler
  const scrollToTop = (e) => {
    e?.stopPropagation?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShowControls(true);
  };

  // Derive nav slugs
  const getNavSlugs = useCallback(() => {
    let next = data?.nextSlug;
    let prev = data?.prevSlug;
    if (chapterList && chapterList.length > 0) {
      const idx = chapterList.findIndex((c) => c.slug === chapter_id);
      if (idx !== -1) {
        if (idx > 0) next = chapterList[idx - 1].slug;
        if (idx < chapterList.length - 1) prev = chapterList[idx + 1].slug;
      }
    }
    return { nextSlug: next, prevSlug: prev };
  }, [data, chapterList, chapter_id]);

  const { nextSlug, prevSlug } = getNavSlugs();

  // Navigate to chapter
  const goToChapter = useCallback(
    (slug) => {
      if (!slug) return;
      clearInterval(timerRef.current);
      window.scrollTo(0, 0);
      navigate(`/doujin/chapter/${slug}`, {
        state: { chapters: chapterList, mangaSlug },
      });
    },
    [navigate, chapterList, mangaSlug]
  );

  // Intersection Observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        setFinishedReading(true);
        if (!alreadyRead) markRead(chapter_id);

        if (nextSlug) {
          setCountdown(AUTO_ADVANCE_SECONDS);
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [data, chapterList, nextSlug, alreadyRead, chapter_id, markRead]);

  // Countdown auto-advance
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      goToChapter(nextSlug);
      return;
    }
    timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown, nextSlug, goToChapter]);

  // Reset when chapter changes
  useEffect(() => {
    setFinishedReading(false);
    setCountdown(null);
    clearInterval(timerRef.current);
    setShowControls(true);
  }, [chapter_id]);

  // Fetch chapter data
  useEffect(() => {
    let isMounted = true;
    const fetchChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDoujinChapter(chapter_id);
        if (isMounted) {
          setData(res);
          if (!mangaSlug && res.mangaSlug) setMangaSlug(res.mangaSlug);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Gagal memuat chapter.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchChapter();
    return () => {
      isMounted = false;
    };
  }, [chapter_id]);

  // Fetch chapter list if missing
  useEffect(() => {
    if (mangaSlug && !chapterList) {
      getDoujinDetail(mangaSlug)
        .then((d) => {
          if (d?.chapters) setChapterList(d.chapters);
        })
        .catch((err) => console.error("Failed to fetch chapter list", err));
    }
  }, [mangaSlug, chapterList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={18} className="text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-indigo-300">
          Menyiapkan Panel Komik Full...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center justify-center">
        <div className="glass-card p-8 rounded-3xl max-w-md border border-white/10 shadow-2xl text-center">
          <AlertTriangle size={44} className="mx-auto text-amber-400 mb-3" />
          <h2 className="text-xl font-bold mb-2 text-white">Gagal Memuat Chapter</h2>
          <p className="text-gray-400 text-sm mb-6">{error || "Data chapter tidak ditemukan."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#030305] flex flex-col select-none relative">
      {/* ── Top Floating Reader Header (Auto-hides on scroll, tap to toggle) ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          showControls
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
        style={{
          background: "rgba(5, 5, 8, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Back button & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (mangaSlug) navigate(`/doujin/${mangaSlug}`);
                else navigate(-1);
              }}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:bg-white/[0.2] border border-white/10 text-gray-200 hover:text-white transition-all flex items-center justify-center cursor-pointer"
              title="Kembali ke Detail Komik"
              aria-label="Kembali"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="min-w-0">
              <h1 className="font-bold text-xs sm:text-sm truncate text-white max-w-[45vw] sm:max-w-md">
                {data.title}
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                {data.images?.length > 0 && (
                  <span>{data.images.length} Halaman</span>
                )}
                {alreadyRead && (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 size={10} /> Dibaca
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Full Width toggle, Fullscreen toggle, Prev/Next Chapters */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Width Toggle: Full (Edge-to-Edge) vs Fit */}
            <button
              onClick={toggleFullWidth}
              className={`p-2 rounded-xl border transition-all flex items-center gap-1 cursor-pointer text-xs font-semibold ${
                isFullWidth
                  ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/40"
                  : "bg-white/[0.05] border-white/10 text-gray-300 hover:bg-white/[0.12]"
              }`}
              title={isFullWidth ? "Mode: Lebar Penuh (Edge-to-Edge). Klik untuk Mode Fit" : "Mode: Fit. Klik untuk Lebar Penuh"}
              aria-label="Toggle Reader Width"
            >
              <Layers size={16} />
              <span className="hidden sm:inline text-[11px]">
                {isFullWidth ? "Full" : "Fit"}
              </span>
            </button>

            {/* Native Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] active:bg-white/[0.2] border border-white/10 text-gray-200 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh (Fullscreen)"}
              aria-label="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Quick Prev / Next Buttons */}
            {prevSlug && (
              <button
                onClick={() => goToChapter(prevSlug)}
                className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-gray-200 hover:text-white transition-all cursor-pointer"
                title="Chapter Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {nextSlug && (
              <button
                onClick={() => goToChapter(nextSlug)}
                className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/30 text-white font-semibold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1"
                title="Chapter Selanjutnya"
              >
                <span className="hidden sm:inline text-xs">Next</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Comic Reader Stream (Tap anywhere to toggle controls) ── */}
      <main
        className={`flex-1 w-full min-h-screen flex flex-col relative transition-all duration-300 pt-0 ${
          isFullWidth ? "max-w-none px-0" : "max-w-4xl mx-auto px-2 sm:px-4"
        }`}
        onClick={() => setShowControls((prev) => !prev)}
      >
        {data.images && data.images.length > 0 ? (
          <>
            <div className="space-y-0 w-full flex flex-col items-center">
              {data.images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative w-full bg-black flex justify-center items-center overflow-hidden"
                  style={{ minHeight: "120px" }}
                >
                  <img
                    src={imgUrl}
                    alt={`Halaman ${idx + 1}`}
                    className={`block object-contain select-none transition-all duration-200 ${
                      isFullWidth
                        ? "w-full h-auto m-0 p-0"
                        : "max-w-full h-auto rounded-md shadow-xl my-1"
                    }`}
                    loading={idx < 4 ? "eager" : "lazy"}
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Scroll Sentinel for Read Progress & Auto Advance */}
            <div ref={sentinelRef} className="h-10" aria-hidden="true" />

            {/* ── End of Chapter Clean Panel (No blocking menus!) ── */}
            <div
              className="w-full max-w-3xl mx-auto px-4 py-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-3xl glass-card border border-white/10 overflow-hidden shadow-2xl relative bg-black/60 backdrop-blur-xl">
                <div className="p-6 border-b border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-emerald-300">
                        Chapter Selesai Dibaca!
                      </h3>
                      <p className="text-gray-400 text-xs">
                        Progres membaca tersimpan otomatis
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={scrollToTop}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                    title="Kembali ke atas"
                  >
                    <ArrowUp size={14} />
                    <span className="hidden sm:inline">Ke Atas</span>
                  </button>
                </div>

                {nextSlug ? (
                  <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-xs flex items-center gap-2">
                      <SkipForward size={14} className="text-indigo-400" />
                      Melanjutkan ke chapter berikutnya...
                    </p>

                    {/* Countdown Progress Bar */}
                    {countdown !== null && (
                      <div>
                        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                            style={{
                              width: `${
                                ((AUTO_ADVANCE_SECONDS - countdown) /
                                  AUTO_ADVANCE_SECONDS) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2 text-xs">
                          <span className="text-gray-500">Auto Advance</span>
                          <span className="text-indigo-300 font-bold">
                            {countdown}s
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => goToChapter(nextSlug)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 font-bold text-sm text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                      >
                        <BookOpen size={18} />
                        Baca Chapter Selanjutnya
                        <ChevronRight size={18} />
                      </button>

                      {countdown !== null && (
                        <button
                          onClick={() => {
                            clearTimeout(timerRef.current);
                            setCountdown(null);
                          }}
                          className="px-5 py-3.5 rounded-2xl glass-card border border-white/10 text-xs text-gray-400 hover:text-white transition-all cursor-pointer"
                        >
                          Batalkan Auto-Play
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-4">
                    <Sparkles size={36} className="mx-auto text-yellow-400 animate-bounce" />
                    <h3 className="font-bold text-base text-white">
                      Semua Chapter Telah Selesai!
                    </h3>
                    <p className="text-gray-400 text-xs">
                      Kamu telah membaca seluruh chapter yang tersedia untuk manga ini.
                    </p>
                    <button
                      onClick={() =>
                        navigate(mangaSlug ? `/doujin/${mangaSlug}` : "/doujin")
                      }
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-semibold transition-all cursor-pointer"
                    >
                      Kembali ke Detail Manga
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-gray-500">
            Tidak ada gambar di dalam chapter ini.
          </div>
        )}
      </main>

      {/* ── Floating Quick Scroll to Top & Controls Toggle (Floating Pill) ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-black/80 hover:bg-indigo-600 text-white/80 hover:text-white border border-white/15 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          title="Kembali ke Paling Atas"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
