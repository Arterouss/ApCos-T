import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Image as ImageIcon,
  Menu,
  Download,
  Loader2,
  ExternalLink,
  Wand2,
} from "lucide-react";

// Tool list
const AI_TOOLS = [
  {
    id: "pollinations-t2i",
    name: "Native AI Image",
    provider: "Pollinations.ai",
    icon: <ImageIcon size={18} />,
    description: "Hasilkan gambar AI resolusi tinggi secara instan.",
    type: "native_image",
  },
  {
    id: "perchance-t2i",
    name: "Perchance AI",
    provider: "Perchance.org",
    icon: <Sparkles size={18} />,
    description: "Generator anime & ilustrasi berbasis Perchance iframe.",
    type: "iframe",
    url: "https://perchance.org/ai-text-to-image-generator",
  },
];

const AiToolsPage = ({ onOpenSidebar }) => {
  const [activeToolId, setActiveToolId] = useState(AI_TOOLS[0].id);
  const activeTool = AI_TOOLS.find((tool) => tool.id === activeToolId);

  // State for Native Image Tool
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);

  const handleGenerateImage = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt.trim()
    )}?nologo=true&seed=${seed}`;
    setGeneratedImage(imageUrl);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    alert("Gagal menghasilkan gambar. Coba prompt lain.");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/10 py-3.5 px-4 sm:px-6 flex items-center justify-between shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          {onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              className="md:hidden text-gray-400 hover:text-white transition-colors p-2 glass-card rounded-full"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 rounded-2xl border border-violet-500/30 shadow-md shadow-violet-500/20">
              <Sparkles className="text-fuchsia-400" size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 font-display leading-tight">
                AI Studio
              </h1>
              <p className="text-[11px] text-gray-400">Generator & Pembuat Karya Seni AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
            <Wand2 size={12} /> Neural Engine Active
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Tool Selector Sidebar */}
        <div className="md:w-64 flex-shrink-0 bg-black/40 border-r border-white/5 overflow-y-auto overflow-x-auto p-3 flex md:flex-col gap-2 z-10 hidden-scrollbar">
          {AI_TOOLS.map((tool) => {
            const isActive = activeToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveToolId(tool.id)}
                className={`relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 text-left min-w-[190px] md:min-w-0 ${
                  isActive
                    ? "glass-card border border-fuchsia-500/40 shadow-lg shadow-fuchsia-500/10 text-white"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? "bg-fuchsia-500/25 text-fuchsia-300 shadow-sm"
                      : "bg-black/40 text-gray-400"
                  }`}
                >
                  {tool.icon}
                </div>
                <div className="min-w-0">
                  <h3 className={`font-bold text-xs sm:text-sm truncate ${isActive ? "text-white" : ""}`}>
                    {tool.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 truncate">{tool.provider}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 relative flex flex-col p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeToolId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto"
            >
              {activeTool.type === "native_image" && (
                <div className="w-full flex flex-col items-center">
                  {/* Results Display Area */}
                  <div className="w-full aspect-square md:aspect-video rounded-3xl glass-card border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-2xl bg-black/60">
                    {generatedImage ? (
                      <>
                        <img
                          src={generatedImage}
                          alt="AI Generated"
                          className={`w-full h-full object-contain transition-opacity duration-500 ${
                            loading ? "opacity-40 blur-xs" : "opacity-100"
                          }`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />

                        {loading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-10">
                            <div className="w-14 h-14 rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin mb-4" />
                            <p className="text-fuchsia-300 text-xs uppercase tracking-widest font-bold animate-pulse">
                              Merender Ilustrasi AI...
                            </p>
                          </div>
                        )}

                        {!loading && (
                          <a
                            href={generatedImage}
                            download="AI_Masterpiece.jpg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 px-4 py-2.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-xl shadow-fuchsia-600/30 border border-white/20 transition-all flex items-center gap-2"
                          >
                            <Download size={14} />
                            <span>Unduh Gambar HD</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 p-8 text-center max-w-md">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-fuchsia-400 mb-4 shadow-lg">
                          <ImageIcon size={36} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-1.5 font-display">
                          Studio Kanvas AI
                        </h3>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Ketik prompt deskripsi visual yang kamu bayangkan di bawah, lalu klik
                          Generate untuk menciptakan gambar baru.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Prompt Form */}
                  <form onSubmit={handleGenerateImage} className="w-full relative">
                    <div className="glass-card p-2 rounded-2xl sm:rounded-full border border-white/10 shadow-2xl focus-within:border-fuchsia-500/50 flex flex-col sm:flex-row items-center gap-2 transition-all">
                      <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Contoh: cybernetic anime warrior girl with glowing neon katana, 8k resolution..."
                        className="flex-1 w-full bg-transparent border-none outline-none text-white text-xs sm:text-sm py-2.5 px-4 placeholder:text-gray-500"
                      />
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-fuchsia-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Generate Art</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTool.type === "iframe" && (
                <div className="w-full h-full flex flex-col pt-2">
                  <div className="glass-card px-5 py-2.5 flex items-center justify-between border border-white/10 border-b-0 text-xs shrink-0 rounded-t-2xl bg-black/60">
                    <span className="text-gray-300 flex items-center gap-2 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Terhubung ke {activeTool.provider}
                    </span>
                    <span className="text-gray-400 max-w-md truncate hidden md:block text-[11px]">
                      {activeTool.description}
                    </span>
                  </div>
                  <div className="flex-1 w-full glass-card border border-white/10 rounded-b-3xl overflow-hidden shadow-2xl min-h-[65vh]">
                    <iframe
                      src={activeTool.url}
                      className="w-full h-full border-0"
                      title={activeTool.name}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AiToolsPage;
