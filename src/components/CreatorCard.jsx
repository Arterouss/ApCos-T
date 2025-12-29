import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { Link } from "react-router-dom";

const CreatorCard = ({ creator }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className="bg-glass backdrop-blur-md border border-glassBorder rounded-xl p-6 text-left shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {creator.name}
            </h3>
            <span className="text-xs uppercase tracking-wider text-gray-400 bg-black/30 px-2 py-1 rounded-full">
              {creator.service}
            </span>
          </div>
          <a
            href={`https://kemono.su/${creator.service}/user/${creator.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink size={20} />
          </a>
        </div>

        <div className="text-sm text-gray-300 mb-2">
          ID: <span className="font-mono text-gray-500">{creator.id}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-glassBorder flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Updated: {new Date(creator.updated * 1000).toLocaleDateString()}
          </span>
          <Link
            to={`/creator/${creator.service}/${creator.id}`}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors inline-block"
          >
            View Posts
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CreatorCard;
