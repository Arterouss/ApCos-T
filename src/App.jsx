import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EHentaiPage from "./pages/EHentaiPage";
import EHentaiDetailPage from "./pages/EHentaiDetailPage";
import CreatorPosts from "./pages/CreatorPosts";
import HanimePage from "./pages/HanimePage";
import HanimeDetailPage from "./pages/HanimeDetailPage";
import Rule34Page from "./pages/Rule34Page";
import Sidebar from "./components/Sidebar";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onOpenSidebar = () => setIsSidebarOpen(true);

  return (
    <Router>
      <div className="min-h-screen text-white relative overflow-hidden bg-neutral-950">
        {/* Global Ambient Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-900/20 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-blue-900/10 rounded-full blur-[100px]" />
        </div>

        {/* Sidebar & Content Wrapper */}
        <div className="relative z-10 flex">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          <main className="flex-1 md:pl-72 min-h-screen transition-all duration-300">
            <Routes>
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
              <Route path="/g/:id/:token" element={<EHentaiDetailPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
