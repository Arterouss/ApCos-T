import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";

const CreatorPosts = () => {
  const { service, id } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Fetch posts from our proxy
        const response = await fetch(`/api/posts/${service}/${id}`);
        if (!response.ok) throw new Error("Failed to fetch posts");
        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setError(
          "Failed to load posts. Make sure the proxy is running and the creator exists."
        );
        setLoading(false);
      }
    };
    fetchPosts();
  }, [service, id]);

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <Link
        to="/"
        className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="mr-2" size={20} />
        Back to Creators
      </Link>

      {error ? (
        <div className="text-center text-red-400 text-xl mt-20">{error}</div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              Posts from {service.charAt(0).toUpperCase() + service.slice(1)}{" "}
              User
            </h1>
            <p className="text-xl text-gray-400">ID: {id}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-glass backdrop-blur-md border border-glassBorder rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col"
              >
                <div className="bg-gray-900 relative">
                  {post.file && post.file.path ? (
                    <img
                      src={`https://kemono.cr${post.file.path}`}
                      alt={post.title}
                      className="w-full h-auto object-contain max-h-[600px] mx-auto"
                      loading="lazy"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-600 bg-gray-800">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white mb-2 line-clamp-2">
                      {post.title || "Untitled Post"}
                    </h3>

                    {/* Tags Section */}
                    {post.tags && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(Array.isArray(post.tags)
                          ? post.tags
                          : post.tags.split(/[ ,]+/).filter((t) => t)
                        ).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-glassBorder">
                    <div className="flex justify-between items-center text-sm text-gray-400 mb-2">
                      <span>
                        {new Date(post.published).toLocaleDateString()}
                      </span>
                      <span className="bg-white/10 px-2 py-0.5 rounded text-xs">
                        {post.file ? "File" : "Text"}
                      </span>
                    </div>

                    <a
                      href={`https://kemono.su/${service}/user/${id}/post/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                    >
                      <ExternalLink size={16} />
                      View Original Post
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CreatorPosts;
