import { format, formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

// Comments Modal
function CommentsModal({ postId, comments: initialComments, onClose, currentUser }) {
  const [comments, setComments] = useState(initialComments || []);
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!currentUser?.id) { alert("Please login to comment"); return; }
    if (!comment.trim()) return;

    const res = await fetch(`${apiUrl}/api/post/${postId}/comment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    if (res.ok) {
      const newComment = await res.json();
      setComments([...comments, newComment]);
      setComment("");
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-box"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>💬 Comments ({comments.length})</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-comments-list">
          {comments.length === 0 ? (
            <p className="no-comments-text">No comments yet. Be the first!</p>
          ) : (
            comments.map((c, i) => (
              <div className="modal-comment" key={i}>
                <div className="modal-comment-author">👤 {c.username}</div>
                <div className="modal-comment-content">{c.content}</div>
                <div className="modal-comment-date">
                  {formatISO9075(new Date(c.createdAt))}
                </div>
              </div>
            ))
          )}
        </div>
        {currentUser?.id ? (
          <form className="modal-comment-form" onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        ) : (
          <p className="modal-login-prompt">
            <Link to="/login">Login</Link> to comment
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function Post({
  _id, title, summary, cover, createdAt, author,
  likes: initialLikes, comments: initialComments,
  variant = "list" // "list" for BlogPage, "feed" for IndexPage
}) {
  const { userInfo } = useContext(UserContext);
  const [likes, setLikes] = useState(initialLikes?.length || 0);
  const [liked, setLiked] = useState(
    userInfo?.id ? initialLikes?.includes(userInfo.id) : false
  );
  const [showModal, setShowModal] = useState(false);
  const [comments] = useState(initialComments || []);

  async function handleLike(e) {
    e.preventDefault();
    e.stopPropagation();
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

  function sharePost(e) {
    e.preventDefault();
    const url = `${window.location.origin}/post/${_id}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  // ===== FEED VARIANT (home page) - full width, 75vh =====
  if (variant === "feed") {
    return (
      <>
        <motion.div
          className="fb-card tiktok-card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          {/* CARD HEADER */}
          <div className="fb-card-header">
            <div className="fb-avatar">
              {author?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="fb-author-info">
              <Link to={`/post/${_id}`} className="fb-author-name">
                {author?.username}
              </Link>
              <time className="fb-time">
                {format(new Date(createdAt), "MMM d, yyyy • h:mm a")}
              </time>
            </div>
            <span className="fb-badge">📝 Blog</span>
          </div>

          {/* TITLE + SUMMARY */}
          <div className="fb-card-body">
            <Link to={`/post/${_id}`} className="fb-title">{title}</Link>
            {summary && <p className="fb-summary">{summary}</p>}
          </div>

          {/* COVER IMAGE + TIKTOK BUTTONS */}
          {cover && (
            <div className="tiktok-media-wrapper">
              <Link to={`/post/${_id}`}>
                <div className="fb-card-image">
                  <img src={`${apiUrl}/${cover}`} alt={title} />
                </div>
              </Link>

              {/* TikTok floating buttons */}
              <div className="tiktok-actions">
                <motion.button
                  className={`tiktok-btn ${liked ? "tiktok-liked" : ""}`}
                  onClick={handleLike}
                  whileTap={{ scale: 1.3 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span>{liked ? "❤️" : "🤍"}</span>
                  <span className="tiktok-count">{likes}</span>
                </motion.button>

                <motion.button
                  className="tiktok-btn"
                  onClick={(e) => { e.preventDefault(); setShowModal(true); }}
                  whileTap={{ scale: 1.2 }}
                >
                  <span>💬</span>
                  <span className="tiktok-count">{comments.length}</span>
                </motion.button>

                <motion.button
                  className="tiktok-btn"
                  onClick={sharePost}
                  whileTap={{ scale: 1.2 }}
                >
                  <span>📤</span>
                  <span className="tiktok-count">Share</span>
                </motion.button>
              </div>
            </div>
          )}

          {/* TikTok style buttons for posts without cover */}
          {!cover && (
            <div style={{ display: "flex", gap: 16, padding: "10px 14px", justifyContent: "flex-end" }}>
              <motion.button onClick={handleLike} whileTap={{ scale: 1.3 }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: liked ? "#e0245e" : "#8B4513", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                {liked ? "❤️" : "🤍"} {likes}
              </motion.button>
              <motion.button onClick={(e) => { e.preventDefault(); setShowModal(true); }} whileTap={{ scale: 1.2 }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#8B4513", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                💬 {comments.length}
              </motion.button>
              <motion.button onClick={sharePost} whileTap={{ scale: 1.2 }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#8B4513", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>
                📤 Share
              </motion.button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showModal && (
            <CommentsModal
              postId={_id}
              comments={comments}
              currentUser={userInfo}
              onClose={() => setShowModal(false)}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // ===== LIST VARIANT (blog page) - compact list =====
  return (
    <>
      <motion.div
        className="blog-list-item"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35 }}
        whileHover={{ backgroundColor: "#faf7f4" }}
      >
        {/* Thumbnail */}
        <Link to={`/post/${_id}`} className="blog-list-thumb">
          {cover ? (
            <img src={`${apiUrl}/${cover}`} alt={title} />
          ) : (
            <div className="blog-list-thumb-placeholder">📝</div>
          )}
        </Link>

        {/* Content */}
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
          {summary && <p className="blog-list-summary">{summary}</p>}

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
              💬 {comments.length}
            </span>
            <Link to={`/post/${_id}`} className="blog-list-read">
              Read more →
            </Link>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <CommentsModal
            postId={_id}
            comments={comments}
            currentUser={userInfo}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
