import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Image as ImageIcon, Menu, Download, Loader2 } from "lucide-react";

// Tool list
const AI_TOOLS = [
  {
    id: "pollinations-t2i",
    name: "Native AI Image",
    provider: "Pollinations.ai",
    icon: <ImageIcon size={20} />,
    description: "Hasilkan gambar AI secara langsung di halaman ini.",
    type: "native_image",
  },
  {
    id: "perchance-t2i",
    name: "Perchance AI",
    provider: "Perchance.org",
    icon: <Sparkles size={20} />,
    description: "Generator pihak ketiga berbasis iframe.",
    type: "iframe",
    url: "https://perchance.org/ai-text-to-image-generator",
  }
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
    // Add random seed to avoid cache
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?nologo=true&seed=${seed}`;
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
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSidebar}
            className="md:hidden text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-xl border border-white/10">
              <Sparkles className="text-fuchsia-400" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                AI Tools
              </h1>
              <p className="text-xs text-gray-400">Kumpulan alat kecerdasan buatan</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Tool Selector */}
        <div className="md:w-64 flex-shrink-0 bg-black/20 border-r border-white/5 overflow-y-auto overflow-x-auto p-4 flex md:flex-col gap-2 z-10 hidden-scrollbar">
          {AI_TOOLS.map((tool) => {
            const isActive = activeToolId === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveToolId(tool.id)}
                className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left min-w-[200px] md:min-w-0 ${
                  isActive
                    ? "bg-white/10 shadow-lg shadow-violet-900/20 border border-white/10"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent"
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 rounded-xl pointer-events-none" />
                )}
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    isActive ? "bg-fuchsia-500/20 text-fuchsia-300" : "bg-black/40 text-gray-400"
                  }`}
                >
                  {tool.icon}
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isActive ? "text-white" : ""}`}>
                    {tool.name}
                  </h3>
                  <p className="text-xs opacity-60">{tool.provider}</p>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-fuchsia-500 rounded-l-full shadow-[0_0_10px_rgba(232,121,249,0.8)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 relative bg-neutral-900 flex flex-col p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeToolId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto"
            >
              {activeTool.type === "native_image" && (
                <div className="w-full flex flex-col items-center">
                  
                  {/* Results Area */}
                  <div className="w-full aspect-square md:aspect-video rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-2xl">
                    {generatedImage ? (
                      <>
                        <img 
                          src={generatedImage} 
                          alt="AI Generated" 
                          className={`w-full h-full object-contain transition-opacity duration-500 ${loading ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                          onLoad={handleImageLoad}
                          onError={handleImageError}
                        />
                        {loading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                            <Loader2 className="animate-spin text-fuchsia-500 mb-4" size={48} />
                            <p className="text-fuchsia-300 font-medium">Bentar, AI lagi gambar...</p>
                          </div>
                        )}
                        {!loading && (
                          <a 
                            href={generatedImage}
                            download="AI_Image.jpg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 p-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg border border-white/10 transition-colors flex items-center gap-2 group"
                          >
                            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
                            <span className="font-semibold text-sm">Download</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-gray-500 p-8 text-center">
                        <ImageIcon size={64} className="mb-4 opacity-50" />
                        <h3 className="text-xl font-medium text-gray-400 mb-2">Area Gambar</h3>
                        <p className="text-sm max-w-sm">
                          Tulis perintah (prompt) di bawah dan tekan Generate. Gambar akan muncul di sini. (Gunakan bahasa Inggris hasil lebih baik).
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleGenerateImage} className="w-full relative">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                      <div className="relative flex items-center bg-neutral-900 border border-white/10 rounded-2xl p-2 shadow-xl focus-within:border-fuchsia-500/50 transition-colors">
                        <input
                          type="text"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="Misal: a beautiful futuristic city in cyberpunk style, highly detailed 8k..."
                          className="flex-1 bg-transparent border-none outline-none text-white py-3 px-4 placeholder:text-gray-600"
                        />
                        <button
                          type="submit"
                          disabled={loading || !prompt.trim()}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-fuchsia-500/25"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="animate-spin" size={20} />
                              Proses...
                            </>
                          ) : (
                            <>
                              <Sparkles size={20} />
                              Generate
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {activeTool.type === "iframe" && (
                <div className="w-full h-full flex flex-col pt-4">
                  <div className="bg-black/60 backdrop-blur-md px-6 py-2 flex items-center justify-between border-b border-white/5 text-sm shrink-0 rounded-t-2xl">
                    <span className="text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Connected to {activeTool.provider}
                    </span>
                    <span className="text-gray-500 max-w-md truncate hidden md:block">{activeTool.description}</span>
                  </div>
                  <div className="flex-1 w-full bg-black/40 border border-white/10 border-t-0 rounded-b-2xl overflow-hidden shadow-2xl">
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
