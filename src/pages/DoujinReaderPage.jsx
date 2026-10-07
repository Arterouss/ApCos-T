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

  // Read-to-bottom detection
  const [finishedReading, setFinishedReading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const sentinelRef = useRef(null);
  const timerRef = useRef(null);

  const { isRead, markRead } = useReadProgress(mangaSlug);
  const alreadyRead = isRead(chapter_id);

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
      { threshold: 0.5 }
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
          Menyiapkan Panel Komik...
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
            className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-black flex flex-col">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-2xl">
        <button
          onClick={() => {
            if (mangaSlug) navigate(`/doujin/${mangaSlug}`);
            else navigate(-1);
          }}
          className="p-2 glass-card hover:border-indigo-500/40 rounded-full transition-all text-gray-300 hover:text-white"
          title="Kembali"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 max-w-[65vw]">
          <h1 className="font-bold text-xs sm:text-sm truncate text-gray-100">
            {data.title}
          </h1>
          {alreadyRead && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              <CheckCircle2 size={12} /> Selesai
            </span>
          )}
        </div>

        {/* Quick Nav arrows */}
        <div className="flex items-center gap-1">
          {prevSlug && (
            <button
              onClick={() => goToChapter(prevSlug)}
              className="p-1.5 rounded-full glass-card hover:border-indigo-500/40 text-gray-400 hover:text-white"
              title="Chapter Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {nextSlug && (
            <button
              onClick={() => goToChapter(nextSlug)}
              className="p-1.5 rounded-full glass-card hover:border-indigo-500/40 text-gray-400 hover:text-white"
              title="Chapter Selanjutnya"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Reader Image Stream */}
      <div className="flex-1 w-full max-w-3xl mx-auto min-h-screen flex flex-col relative pb-32">
        {data.images && data.images.length > 0 ? (
          <>
            <div className="space-y-0.5">
              {data.images.map((imgUrl, idx) => (
                <div key={idx} className="relative w-full bg-black">
                  <img
                    src={imgUrl}
                    alt={`Halaman ${idx + 1}`}
                    className="w-full h-auto object-contain block mx-auto select-none"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>

            {/* Scroll Sentinel */}
            <div ref={sentinelRef} className="h-6" aria-hidden="true" />

            {/* End of Chapter Panel */}
            {finishedReading && (
              <div className="mx-4 my-8 rounded-3xl glass-card border border-white/10 overflow-hidden shadow-2xl relative">
                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 size={20} />
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

                {nextSlug ? (
                  <div className="p-6 space-y-4">
                    <p className="text-gray-300 text-xs flex items-center gap-2">
                      <SkipForward size={14} className="text-indigo-400" />
                      Melanjutkan ke chapter berikutnya secara otomatis...
                    </p>

                    {/* Countdown bar */}
                    {countdown !== null && (
                      <div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
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
                        <div className="flex justify-between items-center mt-1.5 text-xs">
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
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 font-bold text-sm text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                      >
                        <BookOpen size={16} />
                        Baca Chapter Selanjutnya
                        <ChevronRight size={16} />
                      </button>

                      {countdown !== null && (
                        <button
                          onClick={() => {
                            clearTimeout(timerRef.current);
                            setCountdown(null);
                          }}
                          className="px-5 py-3 rounded-2xl glass-card border border-white/10 text-xs text-gray-400 hover:text-white transition-all"
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
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-sm font-semibold transition-all"
                    >
                      Kembali ke Detail Manga
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">
            Tidak ada gambar di dalam chapter ini.
          </div>
        )}
      </div>
    </div>
  );
}
