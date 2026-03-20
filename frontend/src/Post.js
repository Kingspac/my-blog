import { format } from "date-fns";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function Post({ _id, title, summary, cover, createdAt, author, likes: initialLikes, comments: initialComments }) {
  const { userInfo } = useContext(UserContext);
  const [likes, setLikes] = useState(initialLikes?.length || 0);
  const [liked, setLiked] = useState(
    userInfo?.id ? initialLikes?.includes(userInfo.id) : false
  );

  async function handleLike(e) {
    e.preventDefault();
    if (!userInfo?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/post/${_id}/like`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  return (
    <motion.div
      className="blog-list-item"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      whileHover={{ backgroundColor: "#faf7f4" }}
    >
      {/* LEFT - Thumbnail */}
      <Link to={`/post/${_id}`} className="blog-list-thumb">
        {cover ? (
          <img src={`${apiUrl}/${cover}`} alt={title} />
        ) : (
          <div className="blog-list-thumb-placeholder">📝</div>
        )}
      </Link>

      {/* RIGHT - Content */}
      <div className="blog-list-content">
        <Link to={`/post/${_id}`} className="blog-list-title">
          {title}
        </Link>

        <div className="blog-list-meta">
          <span className="blog-list-author">✍️ {author?.username}</span>
          <span className="blog-list-date">
            {format(new Date(createdAt), "MMM d, yyyy")}
          </span>
        </div>

        {summary && (
          <p className="blog-list-summary">{summary}</p>
        )}

        {/* Actions */}
        <div className="blog-list-actions">
          <motion.button
            className={`blog-list-like ${liked ? "blog-list-liked" : ""}`}
            onClick={handleLike}
            whileTap={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {liked ? "❤️" : "🤍"} {likes}
          </motion.button>
          <span className="blog-list-comments">
            💬 {initialComments?.length || 0}
          </span>
          <Link to={`/post/${_id}`} className="blog-list-read">
            Read more →
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
