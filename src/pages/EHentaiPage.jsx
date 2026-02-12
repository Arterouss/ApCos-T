import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Bug, Terminal, CheckSquare, Square } from "lucide-react";
import SearchBar from "../components/SearchBar";
import GlassCard from "../components/GlassCard";

const CATEGORIES = [
  { id: 2, name: "Doujinshi", color: "bg-red-500" },
  { id: 4, name: "Manga", color: "bg-orange-500" },
  { id: 8, name: "Artist CG", color: "bg-yellow-500" },
  { id: 16, name: "Game CG", color: "bg-green-600" },
  { id: 512, name: "Western", color: "bg-green-800" },
  { id: 256, name: "Non-H", color: "bg-blue-400" },
  { id: 32, name: "Image Set", color: "bg-blue-600" },
  { id: 64, name: "Cosplay", color: "bg-purple-500" },
  { id: 128, name: "Asian Porn", color: "bg-pink-400" },
  { id: 1, name: "Misc", color: "bg-gray-400" },
];

const PROXIES = [
  {
    name: "CodeTabs (Recommended)",
    id: "codetabs",
    templ: (u) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  },
  {
    name: "CorsProxy.io",
    id: "corsproxy",
    templ: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  },
  {
    name: "AllOrigins",
    id: "allorigins",
    templ: (u) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
  },
  {
    name: "WhateverOrigin",
    id: "whatever",
    templ: (u) =>
      `http://www.whateverorigin.org/get?url=${encodeURIComponent(u)}`,
  },
];

export default function EHentaiPage({ onOpenSidebar }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debug & Proxy State
  const [activeProxy, setActiveProxy] = useState(PROXIES[0]);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  const [selectedCats, setSelectedCats] = useState(CATEGORIES.map((c) => c.id));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleCategory = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const selectAllCats = () => setSelectedCats(CATEGORIES.map((c) => c.id));
  const clearCats = () => setSelectedCats([]);

  const getFCats = React.useCallback(
    () => 1023 - selectedCats.reduce((a, b) => a + b, 0),
    [selectedCats],
  );

  const dataRef = React.useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchData = React.useCallback(
    async (pageNum, isLoadMore = false, retryCount = 0) => {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      addLog(`Fetching Page ${pageNum}... Proxy: ${activeProxy.name}`);

      try {
        const f_cats = getFCats();
        // Anti-Cache: Append timestamp
        // nw=session: Bypass Content Warning
        // inline_set=dm_e: Force Extended View (Better pagination support & thumbs)
        let url = `https://e-hentai.org/?page=${pageNum}&nw=session&inline_set=dm_e&_ts=${Date.now()}`;
        if (debouncedQuery)
          url += `&f_search=${encodeURIComponent(debouncedQuery)}`;
        if (f_cats > 0) url += `&f_cats=${f_cats}`;

        addLog(`Target URL: ${url}`);

        // Anti-Cache: Append timestamp to Proxy URL too
        const proxyBase = activeProxy.templ(url);
        const proxyUrl = proxyBase.includes("?")
          ? `${proxyBase}&_nocache=${Date.now()}`
          : `${proxyBase}?_nocache=${Date.now()}`;

        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy status: ${res.status}`);

        let html = "";
        if (activeProxy.id === "allorigins" || activeProxy.id === "whatever") {
          const json = await res.json();
          html = json.contents;
        } else {
          html = await res.text();
        }

        const doc = new DOMParser().parseFromString(html, "text/html");

        // AGGRESSIVE PARSING STRATEGY
        const galleryLinks = Array.from(doc.querySelectorAll("a[href*='/g/']"));
        addLog(`Potential Gallery Links: ${galleryLinks.length}`);

        const rawHits = galleryLinks
          .map((link) => {
            const href = link.href;
            const parts = href.split("/");

            let id, token;
            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === "g" && parts[i + 1]) {
                id = parts[i + 1];
                token = parts[i + 2];
                break;
              }
            }
            if (!id || !token) return null;

            let title = link.textContent.trim();
            if (!title || title.length < 5 || title === "1" || !isNaN(title)) {
              const row = link.closest("tr");
              if (row)
                title = row.querySelector(".glink")?.textContent || title;
              const div = link.closest("div.gl3c") || link.closest("div.gl1t");
              if (div && !title) title = div.textContent;
              const glname = link.closest("div")?.querySelector(".glname");
              if (glname) title = glname.textContent;
            }

            // Thumb Extraction (Robust)
            let thumb = "";
            const img = link.querySelector("img");
            if (img)
              thumb =
                img.getAttribute("data-src") || img.getAttribute("src") || "";

            if (!thumb) {
              const divWithStyle =
                link.querySelector("div[style]") ||
                link.closest("div.gl1t")?.querySelector("div[style]");
              if (divWithStyle) {
                const style = divWithStyle.getAttribute("style") || "";
                const match = /url\((.*?)\)/.exec(style);
                if (match) thumb = match[1].replace(/["']/g, "");
              }
            }

            if (!thumb) {
              const wrapper =
                link.closest("div.gl1t") ||
                link.closest("td") ||
                link.closest("div.gl3t");
              if (wrapper) {
                const cImg = wrapper.querySelector("img");
                if (cImg)
                  thumb =
                    cImg.getAttribute("data-src") ||
                    cImg.getAttribute("src") ||
                    "";
              }
            }

            if (!title) title = `Gallery ${id}`;
            if (href.includes("?p=")) return null;

            return { id, token, title, thumb, category: "Gallery" };
          })
          .filter(
            (item) => item !== null && item.title !== `Gallery ${item.id}`,
          );

        // Smart Deduplication: Merge items (prefer ones with thumbnails)
        const uniqueMap = new Map();
        rawHits.forEach((item) => {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          } else {
            const existing = uniqueMap.get(item.id);
            // If existing has no thumb but new one does, update it
            if (!existing.thumb && item.thumb) {
              existing.thumb = item.thumb;
            }
            // If existing title is generic but new one is specific, update it
            if (
              existing.title.startsWith("Gallery") &&
              !item.title.startsWith("Gallery")
            ) {
              existing.title = item.title;
            }
          }
        });
        const newHits = Array.from(uniqueMap.values());

        addLog(`Parsed Valid Items: ${newHits.length}`);
        if (newHits.length > 0) addLog(`First Thumb: ${newHits[0].thumb}`); // DEBUG THUMB

        // DUPLICATE CHECK & AUTO-RETRY LOGIC
        if (isLoadMore) {
          const currentIds = new Set(dataRef.current.map((i) => i.id));
          const uniqueCount = newHits.filter(
            (i) => !currentIds.has(i.id),
          ).length;

          if (uniqueCount === 0 && newHits.length > 0) {
            if (retryCount < 3) {
              addLog(
                `⚠️ All items were duplicates. Retrying Page ${pageNum + 1}...`,
              );
              setPage(pageNum + 1);
              setTimeout(
                () => fetchData(pageNum + 1, true, retryCount + 1),
                1000,
              );
              return; // Stop here, the retry will handle it
            } else {
              addLog("❌ Max retries reached with no new items.");
              setHasMore(false);
            }
          }
        }

        if (newHits.length === 0) setHasMore(false);

        if (isLoadMore) {
          setData((prev) => {
            const exists = new Set(prev.map((i) => i.id));
            const uniqueNew = newHits.filter((i) => !exists.has(i.id));
            addLog(`Added ${uniqueNew.length} new items.`);
            return [...prev, ...uniqueNew];
          });
        } else {
          setData(newHits);
          setHasMore(newHits.length > 0);
        }
      } catch (error) {
        console.error("Scrape Error", error);
        addLog(`ERROR: ${error.message}`);
      } finally {
        if (isLoadMore) setLoadingMore(false);
        else setLoading(false);
      }
    },
    [activeProxy, debouncedQuery, getFCats],
  );

  // Image Proxy Helper (CorsProxy -> Weserv -> Active)
  const getImgProxy = (url) => {
    if (!url) return "";
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setLogs([]);
    fetchData(0, false);
  }, [debouncedQuery, selectedCats, activeProxy]);

  const handleLoadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    addLog(`Loading More: Page ${nextPage}`);
    fetchData(nextPage, true);
  };

  return (
    <div className="min-h-screen text-white pb-20 pt-24 px-4 md:px-8 bg-neutral-950/50">
      <button
        onClick={onOpenSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Debug Button - Simplified */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-black/80 text-green-400 rounded-full border border-green-500/50 shadow-lg opacity-50 hover:opacity-100 transition-opacity"
      >
        <Bug size={20} />
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed bottom-20 right-4 w-80 max-h-96 bg-black/90 border border-green-500/30 rounded-lg p-4 overflow-y-auto z-50 text-xs font-mono text-green-300 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-1">
            <span className="font-bold flex items-center gap-2">
              <Terminal size={14} /> Debug Logs
            </span>
            <button onClick={() => setLogs([])} className="hover:text-white">
              Clear
            </button>
          </div>
          {logs.map((L, i) => (
            <div
              key={i}
              className="mb-1 border-b border-white/5 pb-1 break-words"
            >
              {L}
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col items-start gap-6">
          <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500">
                  E-Hentai
                </span>
                <span className="text-violet-500">.</span>
              </h1>
              <p className="text-gray-400 text-sm max-w-lg leading-relaxed">
                Explore the vast collection of Doujinshi, Manga, and Artist CGS.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 px-3 rounded-full border border-white/10 backdrop-blur-md">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
                Proxy
              </span>
              <select
                value={activeProxy.id}
                onChange={(e) =>
                  setActiveProxy(PROXIES.find((p) => p.id === e.target.value))
                }
                className="bg-transparent text-gray-300 text-xs font-medium focus:outline-none cursor-pointer hover:text-white"
              >
                {PROXIES.map((p) => (
                  <option
                    key={p.id}
                    value={p.id}
                    className="bg-neutral-900 text-gray-300"
                  >
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="w-full space-y-6">
            {/* Search */}
            <div className="max-w-xl">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <h3 className="text-sm font-semibold text-gray-400">
                  Categories
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllCats}
                    className="text-[10px] text-violet-400 hover:text-violet-300 px-2 py-1 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearCats}
                    className="text-[10px] text-gray-500 hover:text-gray-300 px-2 py-1 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCats.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${
                        isSelected
                          ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] transform scale-105"
                          : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-gray-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${isSelected ? cat.color : "bg-gray-600"}`}
                      />
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3">
                <div className="bg-white/5 aspect-[2/3] rounded-xl w-full" />
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {data.map((item, idx) => {
                const thumbSrc = getImgProxy(item.thumb);
                return (
                  <GlassCard
                    key={`${item.id}-${idx}`}
                    to={`/g/${item.id}/${item.token}`}
                    title={item.title}
                    thumb={thumbSrc}
                    category={item.category}
                    fallbackIcon={Menu}
                  />
                );
              })}
            </div>

            {data.length > 0 && hasMore && (
              <div className="mt-20 text-center pb-20">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold transition-all disabled:opacity-50 text-white min-w-[200px] overflow-hidden"
                >
                  <span className="relative z-10 group-hover:text-violet-300 transition-colors">
                    {loadingMore ? "Loading..." : "Load More"}
                  </span>
                  <div className="absolute inset-0 bg-violet-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            )}

            {(!hasMore || data.length === 0) && !loading && (
              <div className="py-20 text-center text-gray-500 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                  <Menu size={24} className="opacity-30" />
                </div>
                <p>
                  {data.length > 0
                    ? "You've reached the end."
                    : "No results found."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
