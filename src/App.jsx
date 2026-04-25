import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import EHentaiPage from "./pages/EHentaiPage";
import EHentaiDetailPage from "./pages/EHentaiDetailPage";
import CreatorPosts from "./pages/CreatorPosts";
import HanimePage from "./pages/HanimePage";
import HanimeDetailPage from "./pages/HanimeDetailPage";

import Rule34Page from "./pages/Rule34Page";
import CosplayTelePage from "./pages/CosplayTelePage";
import CosplayDetailPage from "./pages/CosplayDetailPage";
import Oreno3dPage from "./pages/Oreno3dPage";
import Oreno3dDetailPage from "./pages/Oreno3dDetailPage";
import CavPornPage from "./pages/CavPornPage";
import CavPornDetailPage from "./pages/CavPornDetailPage";
import AiToolsPage from "./pages/AiToolsPage";
import Sidebar from "./components/Sidebar";

const AnimatedRoutes = ({ onOpenSidebar }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<EHentaiPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/creator/:service/:id" element={<CreatorPosts />} />

        <Route
          path="/hanime"
          element={<HanimePage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/hanime/:slug" element={<HanimeDetailPage />} />
        <Route
          path="/rule34"
          element={<Rule34Page onOpenSidebar={onOpenSidebar} />}
        />
        <Route
          path="/cosplay"
          element={<CosplayTelePage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/cosplay/:slug" element={<CosplayDetailPage />} />
        <Route
          path="/oreno3d"
          element={<Oreno3dPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/oreno3d/:slug" element={<Oreno3dDetailPage />} />
        <Route
          path="/cavporn"
          element={<CavPornPage onOpenSidebar={onOpenSidebar} />}
        />
        <Route path="/cavporn/:id/:slug" element={<CavPornDetailPage />} />
        <Route path="/g/:id/:token" element={<EHentaiDetailPage />} />
        <Route
          path="/ai-tools"
          element={<AiToolsPage onOpenSidebar={onOpenSidebar} />}
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onOpenSidebar = () => setIsSidebarOpen(true);

  return (
    <Router>
      <div className="min-h-screen text-white relative overflow-hidden bg-neutral-950">
        {/* Global Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[150px] animate-pulse delay-700" />
        </div>

        {/* Sidebar & Content Wrapper */}
        <div className="relative z-10 flex">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300">
            <AnimatedRoutes onOpenSidebar={onOpenSidebar} />
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
