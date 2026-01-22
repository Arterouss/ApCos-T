import React, { useState } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ onSearch, initialValue = "" }) {
  const [search, setSearch] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(search);
  };

  // Update local state if initialValue changes drastically, but usually not needed for controlled input unless parent forces reset.
  // For now simple internal state with submission.

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-3 max-w-2xl mb-8 relative z-20"
    >
      <div className="relative flex-1 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-violet-400 transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Search tags (e.g. naruto video sort:score)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all text-sm shadow-lg shadow-black/20"
        />
      </div>
      <button
        type="submit"
        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white px-8 rounded-2xl font-semibold transition-all shadow-lg shadow-violet-900/20"
      >
        Search
      </button>
    </form>
  );
}
