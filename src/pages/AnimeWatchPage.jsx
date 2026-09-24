import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function AnimeWatchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution & Server states
  const [currentStreamUrl, setCurrentStreamUrl] = useState("");
  const [activeQuality, setActiveQuality] = useState("");
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [changingStream, setChangingStream] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [showDownloads, setShowDownloads] = useState(false);

  // ── Fetch Episode Data ────────────────────────────────────────────────
  useEffect(() => {
    const fetchEpisode = async () => {
      setLoading(true);
      setError(null);
      setStreamError(null);
      try {
        const res = await fetch(`/api/anime/watch/${slug}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setEpisode(data);

        // Set initial stream URL, quality and server
        const initialQ = data.selectedQuality || (data.qualityKeys && data.qualityKeys[0]) || "360p";
        setActiveQuality(initialQ);
        setActiveServerIndex(0);

        if (data.defaultStreamUrl) {
          setCurrentStreamUrl(data.defaultStreamUrl);
        } else {
          // If default url is not pre-resolved, fetch it
          const firstMirror = data.qualities?.[initialQ]?.[0];
          if (firstMirror) {
            loadMirror(firstMirror, data);
          }
        }
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

  // ── Switch Mirror / Resolution ────────────────────────────────────────
  const loadMirror = async (mirror, epData = episode) => {
    if (!mirror || !epData) return;
    setChangingStream(true);
    setStreamError(null);

    try {
      const res = await fetch("/api/anime/stream-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mirror.id,
          i: mirror.i,
          q: mirror.q,
          nonceAction: epData.nonceAction,
          streamAction: epData.streamAction,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.url) {
        setCurrentStreamUrl(data.url);
      } else {
        throw new Error("Link stream tidak ditemukan pada server ini.");
      }
    } catch (err) {
      console.error("Change stream error:", err);
      setStreamError(`Gagal memuat server ${mirror.name} (${mirror.q}). Silakan pilih server lain.`);
    } finally {
      setChangingStream(false);
    }
  };

  // Change quality tab
  const handleQualityChange = (q) => {
    if (q === activeQuality || changingStream) return;
    setActiveQuality(q);
    setActiveServerIndex(0);

    const mirrorsForQ = episode?.qualities?.[q];
    if (mirrorsForQ && mirrorsForQ[0]) {
      loadMirror(mirrorsForQ[0]);
    }
  };

  // Change server within active quality
  const handleServerChange = (index) => {
    if (index === activeServerIndex || changingStream) return;
    setActiveServerIndex(index);

    const mirror = episode?.qualities?.[activeQuality]?.[index];
    if (mirror) {
      loadMirror(mirror);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={40} className="text-cyan-400 animate-spin mb-4" />
        <p className="text-white/40 text-sm">Memuat episode dan stream...</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error || !episode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-red-400 font-semibold mb-2">Gagal Memuat Episode</p>
        <p className="text-white/40 text-sm mb-4">{error || "Episode tidak ditemukan"}</p>
        <button
          onClick={() => navigate("/anime")}
          className="px-6 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
        >
          Kembali ke Daftar Anime
        </button>
      </div>
    );
  }

  const qualityKeys = episode.qualityKeys || Object.keys(episode.qualities || {});
  const availableServers = episode.qualities?.[activeQuality] || [];

  return (
    <div className="min-h-screen pb-20">
      {/* ── Top Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/75 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() =>
                episode.animeSlug
                  ? navigate(`/anime/detail/${episode.animeSlug}`)
                  : navigate("/anime")
              }
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all text-sm flex-shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            <h1 className="text-sm sm:text-base font-semibold text-white truncate">
              {episode.title}
            </h1>
          </div>

          {/* Episode navigation */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {episode.prevEpisode && (
              <Link
                to={`/anime/watch/${episode.prevEpisode}`}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all text-sm"
                title="Episode Sebelumnya"
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
                title="Episode Selanjutnya"
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
          className="w-full relative"
        >
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl shadow-black/60">
            {currentStreamUrl ? (
              <iframe
                key={currentStreamUrl}
                src={currentStreamUrl}
                className="absolute inset-0 w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <Monitor size={48} className="text-white/20 mb-3" />
                <p className="text-white/60 text-sm font-semibold">
                  Pilih resolusi dan server di bawah untuk mulai menonton
                </p>
                <p className="text-white/30 text-xs mt-1">
                  Tersedia resolusi 360p, 480p, dan 720p HD
                </p>
              </div>
            )}

            {/* Switching Resolution / Mirror Overlay */}
            <AnimatePresence>
              {changingStream && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center z-10"
                >
                  <Loader2 size={36} className="text-cyan-400 animate-spin mb-3" />
                  <p className="text-white/90 text-sm font-semibold">
                    Memuat Resolusi {activeQuality}...
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    Server: {availableServers[activeServerIndex]?.name || "Auto"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stream error alert */}
          {streamError && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{streamError}</span>
              </div>
              <button
                onClick={() => setStreamError(null)}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200"
              >
                Tutup
              </button>
            </div>
          )}
        </motion.div>

        {/* ── RESOLUTION & SERVER SELECTOR ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4"
        >
          {/* 1. Quality / Resolution Row */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Pilih Resolusi Video
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                <Sparkles size={11} />
                <span>Aktif: {activeQuality}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {qualityKeys.map((q) => {
                const isActive = q === activeQuality;
                const isHD = parseInt(q) >= 720;
                return (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    disabled={changingStream}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50 ${
                      isActive
                        ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/30 scale-105 border border-white/20"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-cyan-500/40 hover:text-white"
                    }`}
                  >
                    <span>{q}</span>
                    {isHD && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/30">
                        HD
                      </span>
                    )}
                    {isActive && <CheckCircle2 size={14} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Server / Mirror Row for the selected resolution */}
          {availableServers.length > 0 && (
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Monitor size={15} className="text-violet-400" />
                  <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    Pilih Server / Provider ({activeQuality})
                  </h4>
                </div>
                <span className="text-[11px] text-white/40">
                  {availableServers.length} server tersedia
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {[...availableServers].sort((a, b) => {
                  const aIsOd = a.name.toLowerCase().startsWith('od') || a.name.toLowerCase().includes('desu');
                  const bIsOd = b.name.toLowerCase().startsWith('od') || b.name.toLowerCase().includes('desu');
                  if (aIsOd && !bIsOd) return -1;
                  if (!aIsOd && bIsOd) return 1;
                  return 0;
                }).map((server, i) => {
                  // Find original index in availableServers
                  const origIdx = availableServers.findIndex(s => s.name === server.name);
                  const isActive = origIdx === activeServerIndex;
                  const isRecommended = server.name.toLowerCase().startsWith('od') || server.name.toLowerCase().includes('desu');

                  return (
                    <button
                      key={server.name}
                      onClick={() => handleServerChange(origIdx)}
                      disabled={changingStream}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 capitalize ${
                        isActive
                          ? "bg-violet-600/30 border border-violet-400 text-violet-200 shadow-md shadow-violet-500/20"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-white/90"
                      }`}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>{server.name}</span>
                      {isRecommended && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                          ⭐ Rekomendasi
                        </span>
                      )}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/50 space-y-1 mt-2.5">
                <p>
                  💡 <strong className="text-white/80">Kenapa ada server yang "Not Found" / tidak bisa dibuka?</strong>
                </p>
                <p className="text-white/40 leading-relaxed">
                  Server anime disediakan oleh beberapa pihak ketiga gratisan (seperti Mega, Vidhide, Filedon). File di server luar bisa sewaktu-waktu <em>terhapus (DMCA/hak cipta)</em> atau <em>diblokir operator internet</em>. Jika salah satu server error, cukup klik <strong>server lain di sebelahnya</strong> (disarankan yang berlabel <strong>⭐ Rekomendasi / Odstream</strong>).
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── EPISODE NAVIGATION BUTTONS ─────────────────────────────── */}
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

        {/* ── DOWNLOAD LINKS ACCORDION ──────────────────────────────── */}
        {episode.downloads && episode.downloads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <button
              onClick={() => setShowDownloads(!showDownloads)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-semibold w-full justify-center"
            >
              <Download size={15} />
              <span>{showDownloads ? "Sembunyikan Download" : "Tampilkan Link Download Episode"}</span>
              <ChevronRight
                size={15}
                className={`transition-transform duration-300 ${
                  showDownloads ? "rotate-90" : ""
                }`}
              />
            </button>

            {showDownloads && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3"
              >
                {episode.downloads.map((dl, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm font-semibold text-cyan-400 mb-2">
                      {dl.quality || "Download"}
                    </p>
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
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
