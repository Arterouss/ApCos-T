import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full max-w-2xl mx-auto mb-12"
    >
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="text-gray-400" size={24} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search creators by name, service, or ID..."
        className="w-full py-4 pl-14 pr-6 bg-glass backdrop-blur-md border border-glassBorder rounded-2xl text-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-xl transition-all"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-2xl opacity-50" />
    </motion.div>
  );
};

export default SearchBar;
