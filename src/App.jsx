import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
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
      <div className="min-h-screen text-white bg-[#0f0f0f]">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <Routes>
          <Route path="/" element={<Home onOpenSidebar={onOpenSidebar} />} />
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
