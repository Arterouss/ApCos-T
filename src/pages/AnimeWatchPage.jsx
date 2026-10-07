import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
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
  ShieldAlert,
} from "lucide-react";

export default function AnimeWatchPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resolution & Server states
  const [currentStreamUrl, setCurrentStreamUrl] = useState("");
  const [activeQuality, setActiveQuality] = useState("720p");
  const [activeServerIndex, setActiveServerIndex] = useState(0);
  const [changingStream, setChangingStream] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [showDownloads, setShowDownloads] = useState(false);
  const [cachedStreamUrls, setCachedStreamUrls] = useState({});

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

        // Sort qualities descending (720p > 480p > 360p)
        const sortedKeys = (
          data.qualityKeys || Object.keys(data.qualities || {})
        ).sort((a, b) => (parseInt(b) || 0) - (parseInt(a) || 0));

        // Default to 720p if available, otherwise highest available
        const initialQ =
          sortedKeys.find((k) => k.includes("720")) ||
          data.selectedQuality ||
          sortedKeys[0] ||
          "720p";

        setActiveQuality(initialQ);
        setActiveServerIndex(0);

        // Pre-fill cached streams map from DB data
        const streamMap = { ...(data.streamUrls || {}) };
        if (data.defaultStreamUrl) {
          const defaultQ = data.selectedQuality || initialQ;
          streamMap[defaultQ] = data.defaultStreamUrl;
        }
        setCachedStreamUrls(streamMap);

        if (streamMap[initialQ]) {
          setCurrentStreamUrl(streamMap[initialQ]);
        } else if (data.defaultStreamUrl) {
          setCurrentStreamUrl(data.defaultStreamUrl);
        } else {
          const firstMirror = data.qualities?.[initialQ]?.[0];
          if (firstMirror) {
            loadMirror(firstMirror, data, initialQ);
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
  const loadMirror = async (mirror, epData = episode, targetQ = activeQuality) => {
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
          episodeSlug: slug,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.url) {
        setCurrentStreamUrl(data.url);
        const resolvedQ = targetQ || mirror.q;
        setCachedStreamUrls((prev) => ({ ...prev, [resolvedQ]: data.url }));
      } else {
        throw new Error("Server ini sedang tidak merespon link stream.");
      }
    } catch (err) {
      console.error("Load mirror error:", err);
      setStreamError(
        `Server ${mirror.name} (${mirror.q || targetQ}) tidak dapat memuat video. Silakan pilih server lain di bawah.`
      );
    } finally {
      setChangingStream(false);
    }
  };

  // Switch Quality / Resolution
  const handleQualityChange = async (qualityKey) => {
    if (qualityKey === activeQuality && currentStreamUrl) return;
    setActiveQuality(qualityKey);
    setActiveServerIndex(0);

    // Fast-path: Check if already cached in memory
    if (cachedStreamUrls[qualityKey]) {
      setCurrentStreamUrl(cachedStreamUrls[qualityKey]);
      setStreamError(null);
      return;
    }

    const mirrors = episode?.qualities?.[qualityKey] || [];
    if (mirrors.length > 0) {
      // Pick first mirror, prioritize odstream/desustream if available
      const bestMirror =
        mirrors.find((m) => m.name.toLowerCase().includes("od") || m.name.toLowerCase().includes("desu")) ||
        mirrors[0];

      const bestIdx = mirrors.indexOf(bestMirror);
      setActiveServerIndex(bestIdx >= 0 ? bestIdx : 0);
      await loadMirror(bestMirror, episode, qualityKey);
    } else {
      setStreamError(`Resolusi ${qualityKey} tidak memiliki server alternatif.`);
    }
  };

  // Switch Server within the active quality
  const handleServerChange = (index) => {
    setActiveServerIndex(index);
    const mirrors = episode?.qualities?.[activeQuality] || [];
    if (mirrors[index]) {
      loadMirror(mirrors[index], episode, activeQuality);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07080f]">
        <div className="relative">
          <Loader2 size={48} className="text-neon-cyan animate-spin" />
          <div className="absolute inset-0 blur-xl bg-neon-cyan/20 animate-pulse" />
        </div>
        <p className="text-gray-400 text-xs sm:text-sm mt-4 font-mono tracking-wider">
          MEMUAT PEMUTAR VIDEO...
        </p>
      </div>
    );
  }

  // Error
  if (error || !episode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-[#07080f]">
        <div
          className="rounded-3xl p-8 max-w-md mx-auto"
          style={{
            background: 'rgba(18, 18, 28, 0.6)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
          }}
        >
          <AlertCircle size={48} className="text-neon-red mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Gagal Memuat Episode</h2>
          <p className="text-gray-400 text-xs mb-6">{error || "Episode tidak ditemukan."}</p>
          <button
            onClick={() => navigate("/anime")}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-black transition-all cursor-pointer"
            style={{ background: '#00e5ff' }}
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  const qualityKeys =
    episode.qualityKeys && episode.qualityKeys.length > 0
      ? episode.qualityKeys
      : Object.keys(episode.qualities || {});

  const availableServers = episode.qualities?.[activeQuality] || [];

  return (
    <div className="min-h-screen text-white pb-24 relative overflow-hidden bg-[#07080f]">
      {/* ── Background Aurora Glow ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full bg-cyan-500/[0.06] blur-[160px]" />
        <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/[0.05] blur-[170px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* ── Top Navigation Bar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => {
              if (episode.animeSlug) {
                navigate(`/anime/detail/${episode.animeSlug}`);
              } else {
                navigate("/anime");
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Detail Anime</span>
          </button>

          <div className="flex items-center gap-2">
            {episode.allEpisodes && (
              <Link
                to={`/anime/detail/${episode.animeSlug || ""}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-neon-cyan hover:text-white transition-all"
                style={{
                  background: 'rgba(0, 229, 255, 0.08)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                }}
              >
                <List size={15} />
                <span>Semua Episode</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Title Header ────────────────────────────────────────────── */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white leading-tight tracking-tight">
            {episode.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Otakudesu • Resolusi Aktif: <strong className="text-neon-cyan">{activeQuality}</strong>
          </p>
        </div>

        {/* ── VIDEO PLAYER CONTAINER ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div
            className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl transition-all"
            style={{
              background: '#040508',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 229, 255, 0.12)',
            }}
          >
            {changingStream && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
                <Loader2 size={40} className="text-neon-cyan animate-spin mb-3" />
                <p className="text-white text-xs sm:text-sm font-semibold">
                  Menghubungkan ke resolusi {activeQuality}...
                </p>
                <p className="text-gray-400 text-[11px] mt-1">Memproses stream provider</p>
              </div>
            )}

            {currentStreamUrl ? (
              <iframe
                key={currentStreamUrl}
                src={
                  currentStreamUrl.includes("desustream.net")
                    ? `/api/anime/stream-player?url=${encodeURIComponent(currentStreamUrl)}`
                    : currentStreamUrl
                }
                title={episode.title}
                className="w-full h-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-surface-card">
                <AlertCircle size={40} className="text-neon-red mb-3" />
                <p className="text-white font-bold text-sm mb-1">Stream Belum Tersedia</p>
                <p className="text-gray-400 text-xs max-w-sm mb-4">
                  Pilih resolusi atau server di bawah untuk memuat video.
                </p>
              </div>
            )}
          </div>

          {/* Quick Resolution & Action Bar directly below video */}
          <div
            className="mt-4 p-3 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3"
            style={{
              background: 'rgba(14, 16, 26, 0.65)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Quick Quality Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mr-1">
                <Sliders size={14} className="text-neon-cyan" />
                <span>Pilih Resolusi:</span>
              </span>

              {qualityKeys.map((q) => {
                const isActive = q === activeQuality;
                const isHD = parseInt(q) >= 720;
                return (
                  <button
                    key={`quick-${q}`}
                    onClick={() => handleQualityChange(q)}
                    disabled={changingStream}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 disabled:opacity-50 cursor-pointer ${
                      isActive
                        ? "text-black shadow-lg"
                        : "text-gray-400 hover:text-white"
                    }`}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, #00e5ff, #7c4dff)'
                        : 'rgba(255, 255, 255, 0.04)',
                      border: isActive
                        ? '1px solid rgba(0, 229, 255, 0.8)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      boxShadow: isActive ? '0 0 15px rgba(0, 229, 255, 0.4)' : 'none',
                    }}
                  >
                    <span>{q}</span>
                    {isHD && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-black font-extrabold uppercase">
                        HD
                      </span>
                    )}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions (External link & Server reload) */}
            <div className="flex items-center gap-2 shrink-0">
              {currentStreamUrl && (
                <a
                  href={
                    currentStreamUrl.includes("desustream.net")
                      ? `/api/anime/stream-player?url=${encodeURIComponent(currentStreamUrl)}`
                      : currentStreamUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-neon-cyan transition-all"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  title="Buka Player di Tab Baru"
                >
                  <ExternalLink size={12} />
                  <span>Tab Baru</span>
                </a>
              )}
              {availableServers[activeServerIndex] && (
                <button
                  onClick={() => loadMirror(availableServers[activeServerIndex], episode, activeQuality)}
                  disabled={changingStream}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white transition-all cursor-pointer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                  title="Muat Ulang Server Ini"
                >
                  <Sparkles size={12} className="text-neon-purple" />
                  <span>Reload Server</span>
                </button>
              )}
            </div>
          </div>

          {/* Stream error alert */}
          {streamError && (
            <div
              className="mt-3 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-amber-300 text-xs"
              style={{
                background: 'rgba(251, 191, 36, 0.08)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-amber-400" />
                <span>{streamError}</span>
              </div>
              <button
                onClick={() => setStreamError(null)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition-colors cursor-pointer"
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
          className="mt-6 p-5 rounded-3xl space-y-5"
          style={{
            background: 'rgba(14, 16, 26, 0.65)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* 1. Quality / Resolution Row */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders size={16} className="text-neon-cyan" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Pilihan Resolusi Video
                </h3>
              </div>
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-neon-cyan"
                style={{
                  background: 'rgba(0, 229, 255, 0.1)',
                  border: '1px solid rgba(0, 229, 255, 0.25)',
                }}
              >
                <Sparkles size={11} />
                <span>Resolusi Aktif: {activeQuality}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {qualityKeys.map((q) => {
                const isActive = q === activeQuality;
                const is720 = q.includes("720");
                const is480 = q.includes("480");

                let label = "Hemat Kuota & Cepat";
                if (is720) label = "HD - Jernih & Paling Tajam";
                else if (is480) label = "SD - Standar & Lancar";

                return (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    disabled={changingStream}
                    className="relative flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition-all duration-300 disabled:opacity-50 text-left cursor-pointer"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(124, 77, 255, 0.15))'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isActive
                        ? '2px solid rgba(0, 229, 255, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: isActive ? '0 0 25px rgba(0, 229, 255, 0.2)' : 'none',
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white">{q}</span>
                        {is720 && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase text-black"
                            style={{ background: '#00e5ff' }}
                          >
                            HD
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-normal mt-0.5">{label}</p>
                    </div>
                    {isActive ? (
                      <CheckCircle2 size={20} className="text-neon-cyan shrink-0" />
                    ) : (
                      <span className="text-xs text-gray-500 font-normal">Pilih</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Server / Mirror Row for the selected resolution */}
          {availableServers.length > 0 && (
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Monitor size={15} className="text-neon-purple" />
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Pilih Server Alternatif ({activeQuality})
                  </h4>
                </div>
                <span className="text-[11px] text-gray-500 font-mono">
                  {availableServers.length} server tersedia
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {[...availableServers].sort((a, b) => {
                  const aIsOd = a.name.toLowerCase().startsWith('od') || a.name.toLowerCase().includes('desu');
                  const bIsOd = b.name.toLowerCase().startsWith('od') || b.name.toLowerCase().includes('desu');
                  if (aIsOd && !bIsOd) return -1;
                  if (!aIsOd && bIsOd) return 1;
                  return 0;
                }).map((server) => {
                  const origIdx = availableServers.findIndex(s => s.name === server.name);
                  const isActive = origIdx === activeServerIndex;
                  const isRecommended = server.name.toLowerCase().startsWith('od') || server.name.toLowerCase().includes('desu');

                  return (
                    <button
                      key={server.name}
                      onClick={() => handleServerChange(origIdx)}
                      disabled={changingStream}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 capitalize cursor-pointer"
                      style={{
                        background: isActive
                          ? 'rgba(124, 77, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isActive
                          ? '1px solid rgba(124, 77, 255, 0.6)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#d8b4fe' : '#9ca3af',
                        boxShadow: isActive ? '0 0 15px rgba(124, 77, 255, 0.3)' : 'none',
                      }}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>{server.name}</span>
                      {isRecommended && (
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-bold text-black"
                          style={{ background: '#ffb347' }}
                        >
                          Rekomendasi
                        </span>
                      )}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-neon-purple ml-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div
                className="p-3.5 rounded-2xl text-[11px] text-gray-400 space-y-1.5 mt-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                <p className="flex items-center gap-1.5 font-bold text-gray-300">
                  <ShieldAlert size={13} className="text-neon-cyan" />
                  Tips jika video tidak bisa diputar:
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Jika pemutar menampilkan error atau layar kosong, coba klik server lain di sebelahnya (disarankan yang berlabel <strong>Rekomendasi / Odstream</strong>) atau ganti ke resolusi lain (misal 480p / 720p).
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
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <ChevronLeft size={16} />
              <span>Episode Sebelumnya</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {episode.nextEpisode ? (
            <Link
              to={`/anime/watch/${episode.nextEpisode}`}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-black transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #00e5ff, #7c4dff)',
                boxShadow: '0 4px 20px rgba(0, 229, 255, 0.35)',
              }}
            >
              <span>Episode Selanjutnya</span>
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
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all w-full justify-center cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Download size={15} className="text-neon-cyan" />
              <span>{showDownloads ? "Sembunyikan Link Download" : "Tampilkan Link Download Episode"}</span>
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
                  <div
                    key={i}
                    className="p-4 rounded-2xl"
                    style={{
                      background: 'rgba(14, 16, 26, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <p className="text-xs sm:text-sm font-bold text-neon-cyan mb-2.5">
                      {dl.quality || "Download"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {dl.links.map((link, j) => (
                        <a
                          key={j}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all"
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <ExternalLink size={11} className="text-gray-400" />
                          <span>{link.name}</span>
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
