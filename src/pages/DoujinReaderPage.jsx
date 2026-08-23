import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getDoujinChapter, getDoujinDetail } from "../services/doujinService";
import { useReadProgress } from "../hooks/useReadProgress";
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  AlertTriangle, Loader2, CheckCircle2,
  BookOpen, SkipForward,
} from "lucide-react";

const AUTO_ADVANCE_SECONDS = 5;

export default function DoujinReaderPage() {
  const params = useParams();
  const chapter_id = params["*"] || "";
  const navigate = useNavigate();
  const location = useLocation();

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [chapterList, setChapterList] = useState(location.state?.chapters || null);
  const [mangaSlug,   setMangaSlug]   = useState(location.state?.mangaSlug || null);

  // ── Read-to-bottom detection ──────────────────────────────────────────
  const [finishedReading, setFinishedReading] = useState(false);
  const [countdown,       setCountdown]       = useState(null); // number or null
  const sentinelRef = useRef(null);
  const timerRef    = useRef(null);

  const { isRead, markRead } = useReadProgress(mangaSlug);
  const alreadyRead = isRead(chapter_id);

  // Derive nav slugs (computed after chapterList is available)
  const getNavSlugs = useCallback(() => {
    let next = data?.nextSlug;
    let prev = data?.prevSlug;
    if (chapterList && chapterList.length > 0) {
      const idx = chapterList.findIndex(c => c.slug === chapter_id);
      if (idx !== -1) {
        if (idx > 0)                       next = chapterList[idx - 1].slug;
        if (idx < chapterList.length - 1)  prev = chapterList[idx + 1].slug;
      }
    }
    return { nextSlug: next, prevSlug: prev };
  }, [data, chapterList, chapter_id]);

  const { nextSlug, prevSlug } = getNavSlugs();

  // Navigate to a chapter
  const goToChapter = useCallback((slug) => {
    if (!slug) return;
    clearInterval(timerRef.current);
    window.scrollTo(0, 0);
    navigate(`/doujin/chapter/${slug}`, { state: { chapters: chapterList, mangaSlug } });
  }, [navigate, chapterList, mangaSlug]);

  // Intersection Observer: marks read + starts auto-advance countdown
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        setFinishedReading(true);
        if (!alreadyRead) markRead(chapter_id);

        // Only start countdown if there's a next chapter
        if (nextSlug) {
          setCountdown(AUTO_ADVANCE_SECONDS);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  // Re-run when data/chapterList changes so sentinelRef is attached
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chapterList]);

  // Tick countdown and auto-navigate when it hits 0
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      goToChapter(nextSlug);
      return;
    }
    timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [countdown, nextSlug, goToChapter]);

  // Reset everything when chapter changes
  useEffect(() => {
    setFinishedReading(false);
    setCountdown(null);
    clearInterval(timerRef.current);
  }, [chapter_id]);

  // ── Fetch chapter data ────────────────────────────────────────────────
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
    return () => { isMounted = false; };
  }, [chapter_id]);

  // Fetch chapter list if missing
  useEffect(() => {
    if (mangaSlug && !chapterList) {
      getDoujinDetail(mangaSlug)
        .then(d => { if (d?.chapters) setChapterList(d.chapters); })
        .catch(err => console.error("Failed to fetch chapter list", err));
    }
  }, [mangaSlug, chapterList]);

  // ── Loading / error ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
      <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
      <p className="text-gray-400 text-sm animate-pulse">Memuat Panel Komik...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 pt-16 px-4 flex flex-col items-center justify-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <p className="text-gray-300 max-w-md text-center">{error || "Data chapter tidak ditemukan."}</p>
      <button onClick={() => navigate(-1)} className="mt-6 px-5 py-2.5 bg-neutral-800 rounded-xl hover:bg-neutral-700">
        Kembali
      </button>
    </div>
  );

  return (
    <div className="min-h-screen text-white bg-black flex flex-col">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm md:text-base truncate max-w-[60vw] text-indigo-100">
            {data.title}
          </h1>
          {alreadyRead && <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" title="Sudah Dibaca" />}
        </div>
        <div className="w-9" />
      </div>

      {/* Reader Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto bg-neutral-900 min-h-screen flex flex-col relative pb-28">
        {data.images && data.images.length > 0 ? (
          <>
            {data.images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`Panel ${idx + 1}`}
                className="w-full h-auto object-contain block"
                loading="lazy"
              />
            ))}

            {/* Sentinel for scroll detection */}
            <div ref={sentinelRef} className="h-2" aria-hidden="true" />

            {/* ── End-of-chapter panel ──────────────────────────────────── */}
            {finishedReading && (
              <div className="mx-4 my-6 rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur overflow-hidden shadow-2xl">
                {/* Read badge */}
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-white/5">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <p className="text-emerald-300 font-semibold text-sm">Chapter selesai dibaca!</p>
                </div>

                {nextSlug ? (
                  /* Next chapter block */
                  <div className="p-5">
                    <p className="text-gray-400 text-xs mb-4 flex items-center gap-1.5">
                      <SkipForward size={13} className="text-indigo-400" />
                      Lanjut ke chapter berikutnya secara otomatis…
                    </p>

                    {/* Countdown bar */}
                    {countdown !== null && (
                      <div className="mb-4">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${((AUTO_ADVANCE_SECONDS - countdown) / AUTO_ADVANCE_SECONDS) * 100}%` }}
                          />
                        </div>
                        <p className="text-right text-indigo-300 text-xs mt-1">
                          {countdown}s
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {/* Main next chapter button */}
                      <button
                        onClick={() => goToChapter(nextSlug)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
                      >
                        <BookOpen size={16} />
                        Baca Chapter Berikutnya
                        <ChevronRight size={16} />
                      </button>

                      {/* Cancel auto-advance */}
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
                  /* No next chapter — end of manga */
                  <div className="p-5 text-center">
                    <p className="text-gray-300 font-semibold mb-1">🎉 Kamu sudah membaca semua chapter!</p>
                    <p className="text-gray-500 text-xs mb-4">Tidak ada chapter lagi yang tersedia.</p>
                    <button
                      onClick={() => navigate(`/doujin/${mangaSlug || ""}`)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium transition-all"
                    >
                      Kembali ke Halaman Manga
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="py-32 text-center text-gray-500">
            Tidak ada gambar ditemukan di chapter ini.
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-md border-t border-white/10 px-4 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => goToChapter(prevSlug)}
          disabled={!prevSlug}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          <ChevronLeft size={18} /> Prev
        </button>

        <button
          onClick={() => goToChapter(nextSlug)}
          disabled={!nextSlug}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
