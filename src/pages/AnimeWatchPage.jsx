import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  AlertCircle,
  Play,
  Monitor,
  Download,
  ExternalLink,
} from "lucide-react";

export default function AnimeWatchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMirror, setActiveMirror] = useState(0);
  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true);
      setError(null);
      setActiveMirror(0);
      try {
        const res = await fetch(`/api/anime/watch/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEpisode(data);
      } catch (err) {
        console.error("Fetch episode error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisode();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [slug]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-white/40 text-sm">Memuat episode...</p>
      </div>
    );
  }

  // Error
  if (error || !episode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-red-400 font-semibold mb-2">Gagal Memuat</p>
        <p className="text-white/40 text-sm mb-4">{error || "Episode tidak ditemukan"}</p>
        <button onClick={() => navigate("/anime")} className="px-6 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all">
          Kembali ke Daftar
        </button>
      </div>
    );
  }

  const currentMirror = episode.mirrors?.[activeMirror];

  return (
    <div className="min-h-screen pb-20">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/70 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => episode.animeSlug ? navigate(`/anime/detail/${episode.animeSlug}`) : navigate("/anime")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all text-sm flex-shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-white truncate">{episode.title}</h1>
          </div>

          {/* Episode navigation */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {episode.prevEpisode && (
              <Link
                to={`/anime/watch/${episode.prevEpisode}`}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all text-sm"
              >
                <ChevronLeft size={14} />
                <span className="hidden sm:inline">Prev</span>
              </Link>
            )}
            {episode.animeSlug && (
              <Link
                to={`/anime/detail/${episode.animeSlug}`}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all text-sm"
                title="Semua Episode"
              >
                <List size={14} />
              </Link>
            )}
            {episode.nextEpisode && (
              <Link
                to={`/anime/watch/${episode.nextEpisode}`}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        {/* ── Video Player ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/50">
            {currentMirror ? (
              <iframe
                key={currentMirror.url}
                src={currentMirror.url}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Monitor size={48} className="text-white/20 mb-3" />
                <p className="text-white/40 text-sm">Tidak ada player tersedia untuk episode ini.</p>
                <p className="text-white/25 text-xs mt-1">Coba server/mirror lain di bawah.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Mirror Selector ──────────────────────────────────────── */}
        {episode.mirrors && episode.mirrors.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <h3 className="text-sm font-semibold text-white/60 mb-2.5 flex items-center gap-2">
              <Monitor size={14} className="text-cyan-400" />
              Pilih Server
            </h3>
            <div className="flex flex-wrap gap-2">
              {episode.mirrors.map((mirror, i) => (
                <button
                  key={i}
                  onClick={() => setActiveMirror(i)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    i === activeMirror
                      ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-white/80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Play size={12} fill="currentColor" />
                    {mirror.name || `Server ${i + 1}`}
                  </div>
                  {mirror.quality && mirror.quality !== mirror.name && (
                    <span className="text-[10px] opacity-70">{mirror.quality}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Episode Navigation (Mobile-friendly) ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 flex gap-3"
        >
          {episode.prevEpisode ? (
            <Link
              to={`/anime/watch/${episode.prevEpisode}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-sm font-semibold"
            >
              <ChevronLeft size={16} />
              Episode Sebelumnya
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {episode.nextEpisode ? (
            <Link
              to={`/anime/watch/${episode.nextEpisode}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-400 hover:from-cyan-500/30 hover:to-violet-500/30 transition-all text-sm font-semibold"
            >
              Episode Selanjutnya
              <ChevronRight size={16} />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </motion.div>

        {/* ── Download Links ───────────────────────────────────────── */}
        {episode.downloads && episode.downloads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <button
              onClick={() => setShowDownloads(!showDownloads)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all text-sm font-semibold w-full justify-center"
            >
              <Download size={14} />
              {showDownloads ? "Sembunyikan Download" : "Tampilkan Link Download"}
              <ChevronRight size={14} className={`transition-transform ${showDownloads ? "rotate-90" : ""}`} />
            </button>

            {showDownloads && (
              <div className="mt-3 space-y-3">
                {episode.downloads.map((dl, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm font-semibold text-cyan-400 mb-2">{dl.quality || "Download"}</p>
                    <div className="flex flex-wrap gap-2">
                      {dl.links.map((link, j) => (
                        <a
                          key={j}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all text-xs font-medium"
                        >
                          <ExternalLink size={10} />
                          {link.name}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
