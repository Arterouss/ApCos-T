import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreatorPosts from "./pages/CreatorPosts";

function App() {
  return (
    <Router>
      <div className="min-h-screen text-white bg-[#0f0f0f]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/creator/:service/:id" element={<CreatorPosts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
