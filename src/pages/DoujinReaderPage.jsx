import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getDoujinChapter, getDoujinDetail } from "../services/doujinService";
import { ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from "lucide-react";

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
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchChapter = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await getDoujinChapter(chapter_id);
        if (isMounted) {
          setData(res);
          // If we didn't have mangaSlug from state, get it from chapter data
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
    // DoujinDesu chapter lists are usually ordered latest first (chapter N to 1).
    // So chapter[i-1] is the Next chapter, chapter[i+1] is the Prev chapter.
    const currentIndex = chapterList.findIndex(c => c.slug === chapter_id);
    if (currentIndex !== -1) {
      if (currentIndex > 0) {
        nextSlug = chapterList[currentIndex - 1].slug;
      }
      if (currentIndex < chapterList.length - 1) {
        prevSlug = chapterList[currentIndex + 1].slug;
      }
    }
  }

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
        <h1 className="font-bold text-sm md:text-base truncate max-w-[60%] text-center text-indigo-100">
          {data.title}
        </h1>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Reader Area */}
      <div className="flex-1 w-full max-w-3xl mx-auto bg-neutral-900 min-h-screen flex flex-col relative pb-20">
        {data.images && data.images.length > 0 ? (
          data.images.map((imgUrl, idx) => (
            <img 
              key={idx}
              src={imgUrl}
              alt={`Panel ${idx + 1}`}
              className="w-full h-auto object-contain block"
              loading="lazy"
            />
          ))
        ) : (
          <div className="py-32 text-center text-gray-500">
            Tidak ada gambar ditemukan di chapter ini.
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 backdrop-blur-md border-t border-white/10 px-4 py-4 flex items-center justify-center gap-4">
        <button
          onClick={() => {
            if (prevSlug) {
              // Ensure we keep scroll position at top for new chapter
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
