import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu, Search, Globe, Shield, Zap } from "lucide-react";
import GlobalSearchModal from "./components/GlobalSearchModal";
import Home from "./pages/Home";
import GeneralHome from "./pages/GeneralHome";
import CreatorPosts from "./pages/CreatorPosts";
import HanimeTvPage from "./pages/HanimeTvPage";
import HanimeTvDetailPage from "./pages/HanimeTvDetailPage";

import Rule34Page from "./pages/Rule34Page";
import CosplayTelePage from "./pages/CosplayTelePage";
import CosplayDetailPage from "./pages/CosplayDetailPage";
import CavPornPage from "./pages/CavPornPage";
import CavPornDetailPage from "./pages/CavPornDetailPage";
import DoujinPage from "./pages/DoujinPage";
import DoujinDetailPage from "./pages/DoujinDetailPage";
import DoujinReaderPage from "./pages/DoujinReaderPage";
import NhentaiPage from "./pages/NhentaiPage";
import Sidebar from "./components/Sidebar";
import MobileBottomNav from "./components/MobileBottomNav";

import Porn3dxPage from "./pages/Porn3dxPage";
import Porn3dxDetailPage from "./pages/Porn3dxDetailPage";
import CoomerPage from "./pages/CoomerPage";
import CoomerDetailPage from "./pages/CoomerDetailPage";
import BalbumsPage from "./pages/BalbumsPage";
import BalbumsDetailPage from "./pages/BalbumsDetailPage";
import HentaiPlayPage from "./pages/HentaiPlayPage";
import HentaiPlayDetailPage from "./pages/HentaiPlayDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import PersonalVideoPage from "./pages/PersonalVideoPage";
import PersonalPhotoPage from "./pages/PersonalPhotoPage";
import AnimePage from "./pages/AnimePage";
import AnimeDetailPage from "./pages/AnimeDetailPage";
import AnimeWatchPage from "./pages/AnimeWatchPage";

import { PortalProvider, usePortalMode } from "./context/PortalContext";

// Dynamic Home page based on portal mode
const DynamicHome = ({ onOpenSidebar }) => {
  const { isAdultMode } = usePortalMode();
  return isAdultMode ? <Home onOpenSidebar={onOpenSidebar} /> : <GeneralHome onOpenSidebar={onOpenSidebar} />;
};

// Scroll to top setiap pindah halaman utama (bukan saat pagination)
const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  return null;
};

const AnimatedRoutes = ({ onOpenSidebar }) => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<DynamicHome onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/creator/:service/:id" element={<CreatorPosts />} />
        
        <Route path="/favorites" element={<FavoritesPage onOpenSidebar={onOpenSidebar} />} />
        <Route path="/personal" element={<PersonalVideoPage onOpenSidebar={onOpenSidebar} />} />
        <Route path="/personal-photo" element={<PersonalPhotoPage onOpenSidebar={onOpenSidebar} />} />

        <Route
          path="/hanimetv"
          element={<HanimeTvPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/hanimetv/:slug" element={<HanimeTvDetailPage />} />
        
        <Route
          path="/porn3dx"
          element={<Porn3dxPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/porn3dx/:slug" element={<Porn3dxDetailPage />} />

        <Route
          path="/hentaiplay"
          element={<HentaiPlayPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/hentaiplay/video/:slug" element={<HentaiPlayDetailPage />} />
        
        <Route
          path="/rule34"
          element={<Rule34Page onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/rule34video" element={<Navigate to="/rule34" replace />} />
        
        <Route
          path="/coomer"
          element={<CoomerPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/coomer/:service/:id" element={<CoomerDetailPage />} />
        <Route path="/fapello" element={<Navigate to="/coomer" replace />} />
        <Route path="/fapello/*" element={<Navigate to="/coomer" replace />} />

        <Route
          path="/balbums"
          element={<BalbumsPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/balbums/album/:id" element={<BalbumsDetailPage />} />
        
        <Route
          path="/cosplay"
          element={<CosplayTelePage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/cosplay/:slug" element={<CosplayDetailPage />} />
        <Route
          path="/cavporn"
          element={<CavPornPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/cavporn/:id/:slug" element={<CavPornDetailPage />} />
        <Route
          path="/doujin"
          element={<DoujinPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/doujin/chapter/*" element={<DoujinReaderPage />} />
        <Route path="/doujin/*" element={<DoujinDetailPage />} />
        
        <Route
          path="/nhentai"
          element={<NhentaiPage onOpenSidebar={onOpenSidebar} />}
        />

        {/* Anime Routes (HUB Mode) */}
        <Route path="/anime" element={<AnimePage onOpenSidebar={onOpenSidebar} />} />
        <Route path="/anime/detail/:slug" element={<AnimeDetailPage />} />
        <Route path="/anime/watch/:slug" element={<AnimeWatchPage />} />
      </Routes>
    </AnimatePresence>
  </>
);
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const onOpenSidebar = () => setIsSidebarOpen(true);
  const onOpenSearch = () => setIsGlobalSearchOpen(true);
  const onCloseSearch = () => setIsGlobalSearchOpen(false);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Router>
      <PortalProvider>
        <AppContent
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onOpenSidebar={onOpenSidebar}
          onOpenSearch={onOpenSearch}
          isGlobalSearchOpen={isGlobalSearchOpen}
          onCloseSearch={onCloseSearch}
        />
      </PortalProvider>
    </Router>
  );
}

// Inner component that can use PortalContext (inside PortalProvider)
function AppContent({ isSidebarOpen, setIsSidebarOpen, onOpenSidebar, onOpenSearch, isGlobalSearchOpen, onCloseSearch }) {
  const { isAdultMode, togglePortalMode } = usePortalMode();

  const neon = isAdultMode ? '#ff2d55' : '#00e5ff';
  const neonSecondary = isAdultMode ? '#ffb347' : '#7c4dff';

  return (
    <div className="min-h-screen text-white relative overflow-hidden bg-surface noise-overlay">
      {/* ── Global Ambient Background Orbs & Cyber Auroras ─────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-all duration-1000 transform-gpu">
        {/* Mobile: Ultra-lightweight zero-blur gradient (0% GPU overhead) */}
        <div
          className="md:hidden absolute inset-0 opacity-20"
          style={{
            background: isAdultMode
              ? 'radial-gradient(circle at 50% 10%, #ff2d55 0%, #ff6b35 35%, transparent 70%)'
              : 'radial-gradient(circle at 50% 10%, #00e5ff 0%, #7c4dff 35%, transparent 70%)'
          }}
        />

        {/* Desktop: Rich multi-layer ambient blur orbs */}
        <div className="hidden md:block absolute inset-0">
          {isAdultMode ? (
            <>
              <div
                className="absolute -top-[10%] left-[10%] w-[60%] h-[55%] rounded-full blur-[140px] opacity-[0.26]"
                style={{ background: 'radial-gradient(circle, #ff2d55 0%, #ff6b35 50%, transparent 80%)' }}
              />
              <div
                className="absolute top-[25%] -right-[10%] w-[55%] h-[55%] rounded-full blur-[160px] opacity-[0.20]"
                style={{ background: 'radial-gradient(circle, #ff375f 0%, #7c4dff 50%, transparent 80%)' }}
              />
              <div
                className="absolute -bottom-[10%] left-[25%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.18]"
                style={{ background: 'radial-gradient(circle, #ff6b35 0%, #ff2d55 50%, transparent 80%)' }}
              />
            </>
          ) : (
            <>
              <div
                className="absolute -top-[10%] left-[10%] w-[60%] h-[55%] rounded-full blur-[140px] opacity-[0.26]"
                style={{ background: 'radial-gradient(circle, #00e5ff 0%, #00b0ff 50%, transparent 80%)' }}
              />
              <div
                className="absolute top-[25%] -right-[10%] w-[55%] h-[55%] rounded-full blur-[160px] opacity-[0.20]"
                style={{ background: 'radial-gradient(circle, #7c4dff 0%, #00e5ff 50%, transparent 80%)' }}
              />
              <div
                className="absolute -bottom-[10%] left-[25%] w-[50%] h-[50%] rounded-full blur-[150px] opacity-[0.18]"
                style={{ background: 'radial-gradient(circle, #00b0ff 0%, #7c4dff 50%, transparent 80%)' }}
              />
            </>
          )}
        </div>

        <div
          className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </div>

      {/* ── Sidebar & Content Wrapper ────────────────────────────── */}
      <div className="relative z-10 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSearch={onOpenSearch}
        />

        <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 w-full overflow-x-hidden pb-20 md:pb-0">
          {/* ── Mobile Top Bar ────────────────────────────────────── */}
          <div className="md:hidden sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
            style={{
              background: 'rgba(8,8,12,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            <button
              onClick={onOpenSidebar}
              className="p-2 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.06] rounded-xl text-white transition-all flex items-center justify-center cursor-pointer"
              aria-label="Open Menu"
            >
              <Menu size={20} style={{ color: neon }} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: `${neon}15`,
                  border: `1px solid ${neon}25`,
                }}
              >
                <Zap size={14} style={{ color: neon }} />
              </div>
              <span className="font-display font-black text-base bg-clip-text text-transparent tracking-tight transition-all duration-500"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${neon}, ${neonSecondary})`,
                }}
              >
                ApiCos
              </span>
              <button
                onClick={togglePortalMode}
                className="text-[9px] font-extrabold px-2 py-0.5 rounded-full tracking-wider flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                style={{
                  background: `${neon}15`,
                  color: neon,
                  border: `1px solid ${neon}25`,
                }}
                title={`Beralih ke ${isAdultMode ? "Mode Anime (HUB)" : "Mode Cinema (18+)"}`}
                aria-label="Ganti Mode Portal"
              >
                {isAdultMode ? <Shield size={10} /> : <Globe size={10} />}
                <span>{isAdultMode ? "CINEMA" : "HUB"}</span>
              </button>
            </div>
            <button
              onClick={onOpenSearch}
              className="p-2 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.06] rounded-xl transition-all flex items-center justify-center cursor-pointer"
              style={{ color: neon }}
              aria-label="Cari di semua platform"
              title="Pencarian Cepat"
            >
              <Search size={18} />
            </button>
          </div>

          <AnimatedRoutes onOpenSidebar={onOpenSidebar} />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────── */}
      <MobileBottomNav
        onOpenSidebar={onOpenSidebar}
        onOpenSearch={onOpenSearch}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={onCloseSearch}
      />
    </div>
  );
}

export default App;
