import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import CreatorCard from "../components/CreatorCard";
import SearchBar from "../components/SearchBar";
import mockCreators from "../mocks/creators.json";

const FILTERS = [
  "All",
  "Patreon",
  "Fanbox",
  "Gumroad",
  "Fantia",
  "Subscribestar",
  "Onlyfans",
];

const Home = ({ onOpenSidebar }) => {
  const [creators, setCreators] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/creators");
        if (!response.ok) throw new Error("Failed to fetch from proxy");

        const data = await response.json();
        setCreators(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching creators:", err);
        console.log("Falling back to mock data...");
        setCreators(mockCreators);
        setLoading(false);
      }
    };
    fetchCreators();
  }, []);

  // Reset pagination when search/filter changes
  useEffect(() => {
    setVisibleCount(24);
  }, [searchQuery, activeFilter]);

  const filtered = creators.filter((creator) => {
    const name = creator.name || "";
    const service = creator.service || "";
    const id = creator.id || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      service.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const visibleCreators = filtered.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 24);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center">
      {/* Search Bar & Header Area */}
      <div className="w-full max-w-7xl px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onOpenSidebar}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Open Menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Kemono Discovery
          </h1>
          <div className="w-10"></div> {/* Spacer for center alignment */}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-4">
            Explore Creators
          </h2>
          <p className="text-xl text-gray-400">
            Search thousands of creators across platforms
          </p>
        </motion.div>

        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 mb-12">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                  : "bg-gray-900 text-gray-400 hover:bg-gray-800"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="w-full max-w-7xl px-4 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <>
            <p className="text-gray-500 mb-4 text-right">
              Showing {Math.min(visibleCount, filtered.length)} of{" "}
              {filtered.length} creators
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleCreators.map((creator) => (
                <CreatorCard
                  key={`${creator.service}-${creator.id}`}
                  creator={creator}
                />
              ))}
            </div>

            {filtered.length > visibleCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-full transition-all border border-gray-700"
                >
                  Load More
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                No creators found matching your criteria.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
