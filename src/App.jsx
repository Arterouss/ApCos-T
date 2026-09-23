import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Menu, Search } from "lucide-react";
import GlobalSearchModal from "./components/GlobalSearchModal";
import Home from "./pages/Home";
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

import Porn3dxPage from "./pages/Porn3dxPage";
import Porn3dxDetailPage from "./pages/Porn3dxDetailPage";
import FapelloPage from "./pages/FapelloPage";
import FapelloDetailPage from "./pages/FapelloDetailPage";
import HentaiPlayPage from "./pages/HentaiPlayPage";
import HentaiPlayDetailPage from "./pages/HentaiPlayDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import PersonalVideoPage from "./pages/PersonalVideoPage";
import PersonalPhotoPage from "./pages/PersonalPhotoPage";

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
    <AnimatePresence mode="wait">
      <ScrollToTop />
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<Home onOpenSidebar={onOpenSidebar} />}
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
          path="/fapello"
          element={<FapelloPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/fapello/:slug" element={<FapelloDetailPage />} />
        
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
      </Routes>
    </AnimatePresence>
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
      <div className="min-h-screen text-white relative overflow-hidden bg-[#070709]">
        {/* Global Ambient Cinema Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-rose-950/20 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute top-[35%] right-[-10%] w-[45%] h-[45%] bg-red-950/15 rounded-full blur-[180px] pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[25%] w-[40%] h-[40%] bg-amber-950/15 rounded-full blur-[160px] pointer-events-none" />
        </div>

        {/* Sidebar & Content Wrapper */}
        <div className="relative z-10 flex">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            onOpenSearch={onOpenSearch}
          />

          <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300 w-full overflow-x-hidden">
            {/* Global Sticky Top Header for Mobile */}
            <div className="md:hidden sticky top-0 z-40 bg-[#070709]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between shadow-xl shadow-black/60">
              <button
                onClick={onOpenSidebar}
                className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10 rounded-xl text-white transition-all flex items-center justify-center cursor-pointer"
                aria-label="Open Menu"
              >
                <Menu size={22} className="text-red-400" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-500 to-amber-400 tracking-tight">
                  ApiCos
                </span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600/30 text-red-400 border border-red-500/40 tracking-wider">
                  CINEMA
                </span>
              </div>
              <button
                onClick={onOpenSearch}
                className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/10 rounded-xl text-red-400 hover:text-red-300 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                aria-label="Cari di semua platform"
                title="Pencarian Cepat"
              >
                <Search size={20} />
              </button>
            </div>

            <AnimatedRoutes onOpenSidebar={onOpenSidebar} />
          </main>
        </div>

        {/* Global Search Modal */}
        <GlobalSearchModal
          isOpen={isGlobalSearchOpen}
          onClose={onCloseSearch}
        />
      </div>
    </Router>
  );
}

export default App;
