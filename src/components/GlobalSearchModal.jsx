import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Loader2,
  Film,
  Book,
  Camera,
  Video,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Tag
} from "lucide-react";
import axios from "axios";

// Services
import { getHentaiPlayList } from "../services/hentaiPlayService";
import { getPorn3dxList } from "../services/porn3dxService";
import { getHanimeSearch } from "../services/hanimeTvService";
import { fetchNhentaiGalleries } from "../services/nhentaiService";
import { getDoujinList } from "../services/doujinService";
import { getCavPornSearch } from "../services/cavpornService";

const QUICK_TAGS = [
  "Genshin",
  "Cosplay",
  "Milf",
  "Gyaru",
  "Schoolgirl",
  "Netorare",
  "Honkai",
  "3D",
  "#mygoon",
];

const SOURCE_CONFIG = {
  all: { label: "Semua", color: "from-red-600 to-rose-600", text: "text-white" },
  hentaiplay: { label: "HentaiPlay", color: "from-rose-500 to-pink-600", badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  hanime: { label: "Hanime.tv", color: "from-violet-500 to-purple-600", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  porn3dx: { label: "Porn3dx", color: "from-indigo-500 to-cyan-500", badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  nhentai: { label: "Nhentai", color: "from-pink-500 to-rose-500", badge: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  doujin: { label: "DoujinDesu", color: "from-amber-500 to-orange-500", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  cavporn: { label: "CavPorn", color: "from-cyan-500 to-blue-600", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  personal_photo: { label: "Foto Telegram", color: "from-blue-500 to-emerald-500", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [sourceCounts, setSourceCounts] = useState({});
  const [photoCache, setPhotoCache] = useState(null);

  // Autofocus input saat modal dibuka & lock scroll latar belakang
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Listener tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch semua foto telegram sekali untuk pencarian instan
  const getPersonalPhotos = useCallback(async () => {
    if (photoCache) return photoCache;
    try {
      const res = await axios.get("/api/personal/photos");
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPhotoCache(res.data.data);
        return res.data.data;
      }
    } catch {
      // silently ignore if not logged in or no token
    }
    return [];
  }, [photoCache]);

  // Search logic across all sources
  const performSearch = useCallback(
    async (searchTerm) => {
      const q = searchTerm.trim();
      if (!q) {
        setResults([]);
        setSourceCounts({});
        setLoading(false);
        return;
      }

      setLoading(true);

      const promises = [
        // 1. HentaiPlay
        (async () => {
          try {
            const data = await getHentaiPlayList(1, q);
            const list = data?.videos || [];
            return list.map((item) => ({
              id: `hp-${item.slug}`,
              source: "hentaiplay",
              title: item.title,
              thumbnail: item.thumbnail,
              duration: item.duration,
              extra: item.episode ? `Ep: ${item.episode}` : null,
              onClick: () => {
                navigate(`/hentaiplay/video/${encodeURIComponent(item.slug)}`);
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),

        // 2. HanimeTv
        (async () => {
          try {
            const data = await getHanimeSearch(q, 0);
            const list = data?.hentai_videos || data?.videos || (Array.isArray(data) ? data : []);
            return list.slice(0, 20).map((item) => ({
              id: `hanime-${item.id || item.slug}`,
              source: "hanime",
              title: item.name || item.title || "Unknown",
              thumbnail: item.poster_url || item.cover_url || item.thumbnail,
              duration: item.views ? `${item.views} views` : null,
              extra: item.brand,
              onClick: () => {
                navigate(`/hanimetv/${encodeURIComponent(item.slug || item.id)}`);
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),

        // 3. Porn3dx
        (async () => {
          try {
            const list = await getPorn3dxList(1, q);
            const items = Array.isArray(list) ? list : list?.items || [];
            return items.map((item) => ({
              id: `p3dx-${item.id || item.slug}`,
              source: "porn3dx",
              title: item.title,
              thumbnail: item.cover_url,
              duration: item.duration,
              extra: item.type === "video" ? "3D Video" : "3D Image",
              onClick: () => {
                navigate(`/porn3dx/${encodeURIComponent(item.slug)}`);
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),

        // 4. Nhentai
        (async () => {
          try {
            const data = await fetchNhentaiGalleries(1, q);
            const list = data?.result || data?.data || [];
            return list.slice(0, 20).map((item) => {
              const rawThumb = `https://t.nhentai.net/${item.thumbnail}`;
              const title = item.english_title || item.japanese_title || "Unknown Title";
              return {
                id: `nh-${item.id}`,
                source: "nhentai",
                title,
                thumbnail: `/api/nhentai/image?url=${encodeURIComponent(rawThumb)}`,
                duration: `${item.num_pages} hal`,
                extra: item.num_favorites ? `❤️ ${item.num_favorites}` : null,
                onClick: () => {
                  navigate(`/nhentai?q=${encodeURIComponent(q)}`);
                  onClose();
                },
              };
            });
          } catch {
            return [];
          }
        })(),

        // 5. DoujinDesu
        (async () => {
          try {
            const data = await getDoujinList(1, "", "", q);
            const list = data?.data || (Array.isArray(data) ? data : []);
            return list.map((item) => ({
              id: `doujin-${item.slug}`,
              source: "doujin",
              title: item.title,
              thumbnail: item.thumbnail,
              duration: item.type || "Manga",
              extra: item.score ? `⭐ ${item.score}` : null,
              onClick: () => {
                navigate(`/doujin/${encodeURIComponent(item.slug)}`);
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),

        // 6. CavPorn
        (async () => {
          try {
            const list = await getCavPornSearch(q, 1);
            const items = Array.isArray(list) ? list : list?.videos || [];
            return items.map((item) => ({
              id: `cav-${item.id}`,
              source: "cavporn",
              title: item.title,
              thumbnail: item.thumb,
              duration: item.duration,
              extra: item.views ? `${item.views} views` : null,
              onClick: () => {
                navigate(`/cavporn/${item.id}/${item.slug || "video"}`);
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),

        // 7. Personal Telegram Photos
        (async () => {
          try {
            const photos = await getPersonalPhotos();
            const lowerQ = q.toLowerCase();
            const matched = photos.filter((p) => {
              const caption = (p.caption || "").toLowerCase();
              return caption.includes(lowerQ);
            });
            return matched.map((item) => ({
              id: `tele-${item.id}`,
              source: "personal_photo",
              title: item.caption || "Foto Telegram Tanpa Judul",
              thumbnail: item.proxyUrl || item.url,
              duration: item.date ? new Date(item.date).toLocaleDateString() : "Foto",
              extra: "Pribadi",
              onClick: () => {
                navigate("/personal-photo");
                onClose();
              },
            }));
          } catch {
            return [];
          }
        })(),
      ];

      const settled = await Promise.allSettled(promises);
      const combined = [];
      const counts = {};

      settled.forEach((res) => {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          res.value.forEach((item) => {
            combined.push(item);
            counts[item.source] = (counts[item.source] || 0) + 1;
          });
        }
      });

      setResults(combined);
      setSourceCounts(counts);
      setLoading(false);
    },
    [getPersonalPhotos, navigate, onClose]
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 450);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSourceCounts({});
    inputRef.current?.focus();
  };

  const handleTagClick = (tag) => {
    setQuery(tag);
  };

  const filteredResults =
    activeTab === "all"
      ? results
      : results.filter((item) => item.source === activeTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 px-3 sm:px-4">
        {/* Backdrop Glow & Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-4xl max-h-[88vh] flex flex-col bg-neutral-900/95 border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/80 overflow-hidden z-10"
        >
          {/* Top Search Input Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex items-center gap-3 relative bg-white/[0.02]">
            <div className="text-red-400 pl-1">
              <Search size={22} className="shrink-0" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari anime, 3D, doujin, judul, atau waifu di semua platform..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-base sm:text-lg focus:outline-none pr-3"
            />

            {loading && (
              <Loader2 size={20} className="text-red-500 animate-spin shrink-0" />
            )}

            {query && !loading && (
              <button
                onClick={handleClear}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                title="Hapus pencarian"
              >
                <X size={18} />
              </button>
            )}

            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all ml-1 shrink-0"
            >
              ESC
            </button>
          </div>

          {/* Quick Tags (Muncul kalau query masih kosong) */}
          {!query && (
            <div className="px-5 py-3 border-b border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <TrendingUp size={13} className="text-pink-400" /> Populer:
              </span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/5 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Category Filter Tabs */}
          {results.length > 0 && (
            <div className="px-4 sm:px-5 py-2.5 border-b border-white/5 bg-black/30 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => setActiveTab("all")}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/30"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>Semua</span>
                <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded-full">
                  {results.length}
                </span>
              </button>

              {Object.keys(SOURCE_CONFIG).map((sourceKey) => {
                if (sourceKey === "all") return null;
                const count = sourceCounts[sourceKey] || 0;
                if (count === 0) return null;

                const cfg = SOURCE_CONFIG[sourceKey];
                const isActive = activeTab === sourceKey;

                return (
                  <button
                    key={sourceKey}
                    onClick={() => setActiveTab(sourceKey)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-black/20 text-black font-bold" : "bg-black/40 text-gray-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Content Body / Results Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar min-h-[250px]">
            {/* Initial State */}
            {!query && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-2">
                  <Sparkles size={28} />
                </div>
                <h3 className="text-white font-bold text-base sm:text-lg">
                  Pencarian Terpadu ApiCos
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md">
                  Ketik kata kunci apa saja untuk mencari video Hentai, animasi 3D Porn3dx, komik Doujin & Nhentai, hingga foto galeri pribadi Anda secara serentak.
                </p>
              </div>
            )}

            {/* Loading Spinner with query */}
            {query && loading && results.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-pink-500 animate-spin" />
                <p className="text-gray-400 text-sm animate-pulse">
                  Sedang menelusuri seluruh platform untuk &ldquo;{query}&rdquo;...
                </p>
              </div>
            )}

            {/* Empty State */}
            {query && !loading && filteredResults.length === 0 && (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <p className="text-3xl">🔍</p>
                <h4 className="text-white font-semibold text-sm sm:text-base">
                  Tidak Ada Hasil untuk &ldquo;{query}&rdquo;
                </h4>
                <p className="text-gray-500 text-xs max-w-xs">
                  Coba gunakan kata kunci lain yang lebih umum atau periksa ejaan judul/karakter.
                </p>
              </div>
            )}

            {/* Grid of Results */}
            {filteredResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {filteredResults.map((item) => {
                  const cfg = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.hentaiplay;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={item.onClick}
                      className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-pink-500/50 rounded-xl overflow-hidden cursor-pointer flex flex-col transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-pink-500/10"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[16/10] bg-black/50 overflow-hidden">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}

                        <div className={`w-full h-full flex items-center justify-center bg-neutral-800 ${item.thumbnail ? "hidden" : ""}`}>
                          <Film size={28} className="text-gray-600" />
                        </div>

                        {/* Source Badge */}
                        <div className="absolute top-2 left-2">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-md uppercase tracking-wider ${
                              cfg.badge || "bg-pink-500/20 text-pink-300 border-pink-500/30"
                            }`}
                          >
                            {cfg.label}
                          </span>
                        </div>

                        {/* Duration / Pages Badge */}
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-white">
                            {item.duration}
                          </div>
                        )}
                      </div>

                      {/* Info Body */}
                      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                        <p className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug group-hover:text-pink-300 transition-colors">
                          {item.title}
                        </p>

                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-400">
                          <span>{item.extra || "Klik untuk buka"}</span>
                          <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform text-pink-400" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2.5 border-t border-white/10 bg-neutral-950/80 flex items-center justify-between text-[11px] text-gray-500">
            <div className="flex items-center gap-3">
              <span>💡 Tekan <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px] text-gray-300">ESC</kbd> untuk menutup</span>
            </div>
            <span>
              {results.length > 0 ? `${results.length} total temuan` : "ApiCos Global Engine"}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
