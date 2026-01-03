import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Bug } from "lucide-react";

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
];

export default function EHentaiDetailPage() {
  const { id, token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug State
  const [activeProxy, setActiveProxy] = useState(PROXIES[0]);
  const [logs, setLogs] = useState([]);
  const [showDebug, setShowDebug] = useState(false);
  const addLog = (msg) =>
    setLogs((p) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

  // Reader Modal State
  const [activeImage, setActiveImage] = useState(null);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, [id, token, activeProxy]);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      setLogs([]);
      addLog(`Fetching Gallery ${id}... via ${activeProxy.name}`);

      // nw=session: Bypass Warning
      // inline_set=dm_t: Force Thumbnail View (Standard)
      const targetUrl = `https://e-hentai.org/g/${id}/${token}/?p=0&nw=session&inline_set=dm_t`;
      const proxyUrl = activeProxy.templ(targetUrl);

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy status: ${res.status}`);

      let html = "";
      if (activeProxy.id === "allorigins") {
        const json = await res.json();
        html = json.contents;
      } else {
        html = await res.text();
      }

      addLog(`HTML Length: ${html.length}`);
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Extract Title
      const title =
        doc.querySelector("#gn")?.textContent ||
        doc.querySelector("h1")?.textContent ||
        `Gallery ${id}`;
      addLog(`Title: ${title}`);

      // Extract Tags
      const tags = Array.from(doc.querySelectorAll(".gt, .gtl, .gtw")).map(
        (t) => t.textContent
      );

      // AGGRESSIVE IMAGE FINDER
      const readerLinks = Array.from(doc.querySelectorAll("a[href*='/s/']"));
      addLog(`Reader Links Found: ${readerLinks.length}`);

      const images = readerLinks
        .map((link) => {
          const readerUrl = link.href;

          let thumbUrl = "";
          let thumbPos = undefined; // For Sprites

          // 1. Check for standard IMG tag
          const img = link.querySelector("img");
          if (img) {
            thumbUrl =
              img.getAttribute("src") || img.getAttribute("data-src") || "";
          }

          // 2. If no IMG, check for Sprite (Recursive)
          if (!thumbUrl) {
            const candidates = [
              link,
              link.querySelector("div"),
              link.parentElement,
              link.parentElement?.querySelector("div"),
            ];

            for (const el of candidates) {
              if (!el) continue;
              const style = el.getAttribute("style") || "";

              if (!thumbUrl) {
                const urlMatch = /url\((.*?)\)/.exec(style);
                if (urlMatch) thumbUrl = urlMatch[1].replace(/["']/g, "");
              }

              if (!thumbPos) {
                const posMatch = /(-?\d+px\s+-?\d+px)/.exec(style);
                if (posMatch) thumbPos = posMatch[1];
              }
              if (thumbUrl && thumbPos) break;
            }
          }

          return {
            readerUrl,
            thumbUrl,
            thumbPos,
            page: readerUrl.split("-").pop(),
          };
        })
        .filter((i) => i.thumbUrl);

      addLog(`Valid Images Parsed: ${images.length}`);

      setData({
        id,
        token,
        title,
        tags,
        images,
      });
    } catch (err) {
      console.error(err);
      addLog(`ERROR: ${err.message}`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const openReader = (img) => {
    setActiveImage(img);
    setModalImageSrc(null);
    setModalError(null);
    fetchFullImage(img.readerUrl);
  };

  const closeReader = () => {
    setActiveImage(null);
    setModalImageSrc(null);
  };

  const fetchFullImage = async (url) => {
    try {
      setLoadingImage(true);
      setModalError(null);

      // Append nw=session to Reader URL just in case
      const safeUrl = url.includes("?")
        ? `${url}&nw=session`
        : `${url}?nw=session`;
      const proxyUrl = activeProxy.templ(safeUrl);

      addLog(`Fetching Reader: ${safeUrl}`);

      const res = await fetch(proxyUrl);

      let html = "";
      if (activeProxy.id === "allorigins") {
        const json = await res.json();
        html = json.contents;
      } else {
        html = await res.text();
      }

      const doc = new DOMParser().parseFromString(html, "text/html");

      // E-Hentai Reader Image is usually <img id="img">
      const img = doc.querySelector("#img");
      if (img && img.src) {
        addLog(`Full Image Found: ${img.src}`);
        setModalImageSrc(img.src);
      } else {
        // Fallback: look for large image
        const allImgs = Array.from(doc.querySelectorAll("img"));
        const likelyImg = allImgs.find(
          (i) =>
            i.src.includes("/h/") || i.style.height === "" || i.id === "img"
        );
        if (likelyImg) {
          addLog(`Fallback Image Found: ${likelyImg.src}`);
          setModalImageSrc(likelyImg.src);
        } else {
          console.log("Full HTML dump for debug:", html.substring(0, 500));
          addLog("Error: Image #img not found in reader page");
          setModalError("Could not find image in page source.");
        }
      }
    } catch (err) {
      console.error("Failed to load full image", err);
      addLog(`Reader Error: ${err.message}`);
      setModalError(err.message);
    } finally {
      setLoadingImage(false);
    }
  };

  const navigateImage = (direction) => {
    if (!data || !activeImage) return;
    const currentIndex = data.images.findIndex(
      (img) => img.readerUrl === activeImage.readerUrl
    );
    let newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < data.images.length) {
      openReader(data.images[newIndex]);
    }
  };

  // Helper for Display URL (Detail Page Grid)
  const getDisplayUrl = (img) => {
    if (!img.thumbUrl) return "";
    if (img.thumbPos) return activeProxy.templ(img.thumbUrl); // Sprite
    if (img.thumbUrl.includes("http"))
      return `https://wsrv.nl/?url=${encodeURIComponent(img.thumbUrl)}`; // Normal
    return img.thumbUrl;
  };

  // Helper for Full Res (Reader)
  const getFullResProxy = (url) => {
    if (!url) return "";
    // Try corsproxy first as it's cleaner for raw images
    return `https://corsproxy.io/?${encodeURIComponent(url)}`;
  };

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p>Loading Gallery...</p>
        <div className="mt-4 text-xs font-mono text-gray-500 max-w-lg mx-auto p-4 border border-white/10 rounded bg-black/50">
          {logs.slice(0, 3).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    );

  if (!data || !data.images)
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white gap-4 p-4">
        <div className="text-red-500 font-bold mb-2">
          Gallery Not Found / Empty
        </div>
        <div className="text-xs font-mono bg-black/50 p-4 rounded border border-red-900 w-full max-w-2xl h-64 overflow-auto">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <button
          onClick={fetchGallery}
          className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20 pt-20 px-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-start">
          <Link
            to="/"
            className="inline-flex items-center text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft size={20} className="mr-2" /> Back to Discovery
          </Link>

          <select
            value={activeProxy.id}
            onChange={(e) =>
              setActiveProxy(PROXIES.find((p) => p.id === e.target.value))
            }
            className="bg-black/50 text-white text-xs rounded px-2 py-1 border border-white/20"
          >
            {PROXIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent mb-2">
          {data.title}
        </h1>
        <div className="flex flex-wrap gap-2 text-sm text-gray-400">
          {data.tags.map((tag, i) => (
            <span key={i} className="bg-white/10 px-2 py-1 rounded text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.images.map((img, idx) => (
          <div
            key={idx}
            className="group relative cursor-pointer aspect-[2/3] bg-gray-900 rounded-lg overflow-hidden border border-white/5 hover:border-amber-500/50 transition-colors"
            onClick={() => openReader(img)}
          >
            <div
              className={`w-full h-full ${
                img.thumbPos ? "" : "bg-cover bg-center"
              } transform group-hover:scale-110 transition-transform duration-300`}
              style={{
                backgroundImage: `url(${getDisplayUrl(img)})`,
                backgroundPosition: img.thumbPos || "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: img.thumbPos ? "initial" : undefined,
              }}
            />
            <span className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[10px] text-white">
              {img.page}
            </span>
          </div>
        ))}
      </div>

      {/* Reader Modal */}
      {activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-center items-center backdrop-blur-sm">
          {/* Controls */}
          <button
            onClick={closeReader}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 z-50"
          >
            <X size={24} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage("prev");
            }}
            className="absolute left-4 p-4 text-white hover:text-amber-400 disabled:opacity-30 z-50 hidden md:block"
            disabled={activeImage.page === "1"}
          >
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateImage("next");
            }}
            className="absolute right-4 p-4 text-white hover:text-amber-400 disabled:opacity-30 z-50 hidden md:block"
          >
            <ChevronRight size={40} />
          </button>

          {/* Tap Zones for Mobile */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage("prev");
            }}
          ></div>
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              navigateImage("next");
            }}
          ></div>

          {/* Image Container */}
          <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
            {/* Error State */}
            {modalError && (
              <div className="text-red-500 bg-black/80 p-4 rounded border border-red-500 z-50 text-center">
                <p className="font-bold">Failed to load image</p>
                <p className="text-xs font-mono mt-1">{modalError}</p>
                <button
                  onClick={() => fetchFullImage(activeImage.readerUrl)}
                  className="mt-2 bg-white/20 px-3 py-1 rounded hover:bg-white/30 text-white text-xs"
                >
                  Retry
                </button>
              </div>
            )}

            {loadingImage && (
              <div className="absolute z-20 animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            )}

            {/* High Res Image */}
            {modalImageSrc && !modalError && (
              <img
                src={getFullResProxy(modalImageSrc)}
                alt={`Page ${activeImage.page}`}
                className="max-h-full max-w-full object-contain select-none pointer-events-auto relative z-10 shadow-2xl"
                onError={(e) => {
                  // Fallback to Weserv if Corsproxy fails
                  if (e.target.src.includes("corsproxy")) {
                    console.log("Corsproxy failed, trying Weserv fallback");
                    e.target.src = `https://wsrv.nl/?url=${encodeURIComponent(
                      modalImageSrc
                    )}`;
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
              />
            )}
          </div>

          <div className="absolute bottom-8 bg-black/50 px-4 py-1 rounded-full text-sm backdrop-blur-md border border-white/10 z-20">
            Page {activeImage.page}
          </div>
        </div>
      )}
    </div>
  );
}
