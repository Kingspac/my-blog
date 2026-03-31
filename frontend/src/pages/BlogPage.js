import Post from "../Post.js";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { motion } from "framer-motion";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const { userInfo } = useContext(UserContext);
  useEffect(() => {
    fetch(`${apiUrl}/api/post`)
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);
console.log(userInfo)
  return (
    <div className="blog-page">

      {/* PAGE HEADER */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2>📝 Blog</h2>
        <p>Stories, thoughts and voices of the Adara people</p>
        {userInfo?.id && (
          <Link to="/create" className="create-btn">
            + Create Post
          </Link>
        )}
      </motion.div>

      {/* POSTS LIST */}
      <div className="blog-list">
        {posts.length === 0 && (
          <p className="no-content">No posts yet. Be the first to write!</p>
        )}
        {posts.map((post) => (
          <Post key={post._id} {...post} />
        ))}
      </div>
    </div>
  );
}
