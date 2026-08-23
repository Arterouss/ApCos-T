import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getDoujinChapter, getDoujinDetail } from "../services/doujinService";
import { useReadProgress } from "../hooks/useReadProgress";
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";

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

  // ── "Read to bottom" detection ───────────────────────────────────────
  const [finishedReading, setFinishedReading] = useState(false);
  const sentinelRef = useRef(null); // invisible div at the very end of images

  const { isRead, markRead } = useReadProgress(mangaSlug);
  const alreadyRead = isRead(chapter_id);

  // Intersection Observer: fires when the last image sentinel enters the viewport
  useEffect(() => {
    if (!sentinelRef.current || alreadyRead) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFinishedReading(true);
          markRead(chapter_id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [data, alreadyRead, chapter_id, markRead]);

  // Reset finished state when navigating to a new chapter
  useEffect(() => {
    setFinishedReading(false);
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
          if (!mangaSlug && res.mangaSlug) {
            setMangaSlug(res.mangaSlug);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Gagal memuat chapter.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChapter();

    return () => {
      isMounted = false;
    };
  }, [chapter_id]);

  // Fetch chapter list if we have mangaSlug but no chapter list
  useEffect(() => {
    if (mangaSlug && !chapterList) {
      const fetchDetail = async () => {
        try {
          const detail = await getDoujinDetail(mangaSlug);
          if (detail && detail.chapters) {
            setChapterList(detail.chapters);
          }
        } catch (err) {
          console.error("Failed to fetch chapter list for navigation", err);
        }
      };
      fetchDetail();
    }
  }, [mangaSlug, chapterList]);

  // Calculate next and prev slugs based on chapter list
  let nextSlug = data?.nextSlug;
  let prevSlug = data?.prevSlug;

  if (chapterList && chapterList.length > 0) {
    const currentIndex = chapterList.findIndex(c => c.slug === chapter_id);
    if (currentIndex !== -1) {
      if (currentIndex > 0) nextSlug = chapterList[currentIndex - 1].slug;
      if (currentIndex < chapterList.length - 1) prevSlug = chapterList[currentIndex + 1].slug;
    }
  }

  // ── Loading & error states ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-4">
        <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-gray-400 text-sm animate-pulse">Memuat Panel Komik...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white pb-20 pt-16 px-4 flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <p className="text-gray-300 max-w-md text-center">{error || "Data chapter tidak ditemukan."}</p>
        <button onClick={() => navigate(-1)} className="mt-6 px-5 py-2.5 bg-neutral-800 rounded-xl hover:bg-neutral-700">
          Kembali
        </button>
      </div>
    );
  }

  const showCompleteBanner = finishedReading || alreadyRead;

  return (
    <div className="min-h-screen text-white bg-black flex flex-col">
      {/* Top Navbar */}
      <div className="sticky top-0 z-50 bg-neutral-950/90 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-sm md:text-base truncate max-w-[60vw] text-center text-indigo-100">
            {data.title}
          </h1>
          {(alreadyRead) && (
            <span title="Sudah Dibaca" className="flex-shrink-0">
              <CheckCircle2 size={18} className="text-emerald-400" />
            </span>
          )}
        </div>
        <div className="w-9" />
      </div>

      {/* Reader Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto bg-neutral-900 min-h-screen flex flex-col relative pb-20">
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
            {/* Sentinel — when this element is seen, chapter is marked as read */}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />
          </>
        ) : (
          <div className="py-32 text-center text-gray-500">
            Tidak ada gambar ditemukan di chapter ini.
          </div>
        )}

        {/* "Selesai Dibaca" celebration banner */}
        {showCompleteBanner && (
          <div className="mx-4 mb-6 p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex items-center gap-3 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={28} className="text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-emerald-300 text-sm">
                {finishedReading && !alreadyRead ? "Chapter Selesai Dibaca! 🎉" : "Sudah Dibaca Sebelumnya ✅"}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                Progress tersimpan otomatis di perangkat ini.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-md border-t border-white/10 px-4 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (prevSlug) {
              window.scrollTo(0, 0);
              navigate(`/doujin/chapter/${prevSlug}`, { state: { chapters: chapterList, mangaSlug } });
            }
          }}
          disabled={!prevSlug}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 rounded-xl font-medium transition-colors"
        >
          <ChevronLeft size={18} /> Prev
        </button>

        <button
          onClick={() => {
            if (nextSlug) {
              window.scrollTo(0, 0);
              navigate(`/doujin/chapter/${nextSlug}`, { state: { chapters: chapterList, mangaSlug } });
            }
          }}
          disabled={!nextSlug}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 rounded-xl font-medium transition-colors"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
