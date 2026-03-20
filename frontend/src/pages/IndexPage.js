import Post from "../Post.js";
import { useEffect, useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { format, formatISO9075 } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "../UserContext";
import styles from "../styles/IndexPage.module.css";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isVideoFile(filename) {
  if (!filename) return false;
  const ext = filename.split(".").pop().toLowerCase();
  return ["mp4", "webm", "ogg", "mov", "mkv"].includes(ext);
}

let currentlyPlaying = null;

// Comments Modal
function CommentsModal({ mediaId, comments: initialComments, onClose, currentUser }) {
  const [comments, setComments] = useState(initialComments || []);
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!currentUser?.id) { alert("Please login to comment"); return; }
    if (!comment.trim()) return;

    const res = await fetch(`${apiUrl}/api/music/${mediaId}/comment`, {
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

// TikTok-style Media Card
function MediaCard({ item }) {
  const mediaRef = useRef(null);
  const cardRef = useRef(null);
  const { userInfo } = useContext(UserContext);
  const [likes, setLikes] = useState(item.likes?.length || 0);
  const [liked, setLiked] = useState(
    userInfo?.id ? item.likes?.includes(userInfo.id) : false
  );
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState(item.comments || []);

  function handlePlay() {
    if (currentlyPlaying && currentlyPlaying !== mediaRef.current) {
      currentlyPlaying.pause();
    }
    currentlyPlaying = mediaRef.current;
  }

  useEffect(() => {
    const card = cardRef.current;
    const media = mediaRef.current;
    if (!card || !media) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && !media.paused) {
            media.pause();
            if (currentlyPlaying === media) currentlyPlaying = null;
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  async function handleLike() {
    if (!userInfo?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/music/${item._id}/like`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  function shareMedia() {
    const url = `${window.location.origin}/entertainment`;
    if (navigator.share) {
      navigator.share({ title: item.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  const hasVideo = isVideoFile(item.audioFile);
  const hasMedia = item.audioFile || item.youtubeLink;

  return (
    <>
      <motion.div
        ref={cardRef}
        className="fb-card tiktok-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45 }}
        whileHover={{ y: -2 }}
      >
        {/* CARD HEADER */}
        <div className="fb-card-header">
          <div className="fb-avatar">
            {item.uploadedBy?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="fb-author-info">
            <Link to={`/profile/${item.uploadedBy?._id}`} className="fb-author-name">
              {item.artist || item.uploadedBy?.username}
            </Link>
            <time className="fb-time">
              {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
            </time>
          </div>
          <span className="fb-badge">
            {item.category === "music" ? "🎵 Music" : "🎬 Video"}
          </span>
        </div>

        {/* TITLE */}
        <div className="fb-card-body">
          <p className="fb-title">{item.title}</p>
          {item.description && <p className="fb-summary">{item.description}</p>}
        </div>

        {/* MEDIA + TIKTOK BUTTONS */}
        <div className="tiktok-media-wrapper">

          {/* Cover Photo */}
          {item.coverPhoto && !item.youtubeLink && !hasVideo && (
            <div className="fb-card-image">
              <img src={`${apiUrl}/${item.coverPhoto}`} alt={item.title} />
            </div>
          )}

          {/* YouTube */}
          {item.youtubeLink && (
            <div className="fb-card-image">
              <iframe
                width="100%"
                height="280"
                src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                title={item.title}
                frameBorder="0"
                allowFullScreen
                style={{ display: "block" }}
              />
            </div>
          )}

          {/* Video */}
          {item.audioFile && !item.youtubeLink && hasVideo && (
            <div className="fb-card-image" style={{ background: "#000" }}>
              <video
                ref={mediaRef}
                controls
                onPlay={handlePlay}
                style={{ width: "100%", display: "block", maxHeight: "360px" }}
              >
                <source src={`${apiUrl}/${item.audioFile}`} type="video/mp4" />
              </video>
            </div>
          )}

          {/* Audio */}
          {item.audioFile && !item.youtubeLink && !hasVideo && (
            <div className="fb-audio-player">
              <div className="fb-audio-icon">🎵</div>
              <audio
                ref={mediaRef}
                controls
                onPlay={handlePlay}
                style={{ flex: 1 }}
              >
                <source src={`${apiUrl}/${item.audioFile}`} />
              </audio>
            </div>
          )}

          {/* TIKTOK FLOATING BUTTONS */}
          {hasMedia && (
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
                onClick={() => setShowModal(true)}
                whileTap={{ scale: 1.2 }}
              >
                <span>💬</span>
                <span className="tiktok-count">{comments.length}</span>
              </motion.button>

              <motion.button
                className="tiktok-btn"
                onClick={shareMedia}
                whileTap={{ scale: 1.2 }}
              >
                <span>📤</span>
                <span className="tiktok-count">Share</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* FOOTER for audio (no floating buttons space) */}
        {item.audioFile && !hasVideo && (
          <div className="fb-card-footer">
            <motion.button
              className={`fb-action-btn ${liked ? "fb-liked" : ""}`}
              onClick={handleLike}
              whileTap={{ scale: 1.2 }}
            >
              <span>{liked ? "❤️" : "🤍"}</span> {likes}
            </motion.button>
            <motion.button
              className="fb-action-btn"
              onClick={() => setShowModal(true)}
              whileTap={{ scale: 1.1 }}
            >
              <span>💬</span> {comments.length}
            </motion.button>
            <motion.button
              className="fb-action-btn"
              onClick={shareMedia}
              whileTap={{ scale: 1.1 }}
            >
              <span>📤</span> Share
            </motion.button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <CommentsModal
            mediaId={item._id}
            comments={comments}
            currentUser={userInfo}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// MAIN INDEX PAGE
export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [music, setMusic] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${apiUrl}/api/post`).then((r) => r.json()),
      fetch(`${apiUrl}/api/music`).then((r) => r.json()),
    ]).then(([postsData, musicData]) => {
      setPosts(postsData);
      setMusic(musicData);
      setLoaded(true);
    });
  }, []);

  const mixedFeed = [
    ...posts.map((p) => ({ ...p, itemType: "post" })),
    ...music.map((m) => ({ ...m, itemType: "media" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={styles.feedPage}>

      {/* FEED HEADER */}
      <motion.div
        className={styles.feedHeader}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Welcome to Enchwra 🪨</h2>
        <p>Voice, Culture & Entertainment of the Adara People</p>
      </motion.div>

      {/* ROOM BANNER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Link to="/room" className={styles.roomBanner}>
          🪨 Join the Enchwra Community Room — Come talk with your people!
        </Link>
      </motion.div>

      {/* FEED */}
      <div className={styles.feedContainer}>
        {loaded && mixedFeed.length === 0 && (
          <p className="no-content">No content yet. Be the first to post!</p>
        )}
        {loaded && mixedFeed.map((item) => (
          <div key={item._id}>
            {item.itemType === "post" && <Post {...item} />}
            {item.itemType === "media" && <MediaCard item={item} />}
          </div>
        ))}
      </div>
    </div>
  );
}
