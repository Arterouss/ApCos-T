import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

const Home = () => {
  const [creators, setCreators] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:3001/api/creators");
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

  const filtered = creators.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === "All" ||
      creator.service.toLowerCase() === activeFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          Kemono Discovery
        </h1>
        <p className="text-xl text-gray-400">
          Explore and search thousands of creators
        </p>
      </motion.div>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              activeFilter === filter
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                : "bg-glass border border-glassBorder text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="text-gray-400 mb-6 text-right">
            Showing {filtered.length} creators
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.slice(0, 100).map((creator) => (
              <CreatorCard
                key={`${creator.service}-${creator.id}`}
                creator={creator}
              />
            ))}
          </div>
          {filtered.length > 100 && (
            <div className="mt-8 text-center text-gray-500 italic">
              Showing top 100 results for performance...
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
