import { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { format, formatISO9075 } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

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

// ===== COMMENTS MODAL =====
function CommentsModal({ media, currentUser, onClose }) {
  const [comments, setComments] = useState(media.comments || []);
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!currentUser?.id) { alert("Please login to comment"); return; }
    if (!comment.trim()) return;
    const res = await fetch(`${apiUrl}/api/music/${media._id}/comment`, {
      method: "POST", credentials: "include",
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
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="modal-box"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" style={{ width: 40, height: 4, background: "#e0d0c0", borderRadius: 4, margin: "0 auto 14px" }} />
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
                <div className="modal-comment-date">{formatISO9075(new Date(c.createdAt))}</div>
              </div>
            ))
          )}
        </div>
        {currentUser?.id ? (
          <form className="modal-comment-form" onSubmit={handleComment}>
            <input type="text" placeholder="Write a comment..."
              value={comment} onChange={(e) => setComment(e.target.value)} />
            <button type="submit">Post</button>
          </form>
        ) : (
          <p className="no-comments-text">
            <Link to="/login" style={{ color: "#CD853F", fontWeight: 600 }}>Login</Link> to comment
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ===== MEDIA CARD - pure TikTok style =====
function MediaCard({ media, currentUser, onDelete }) {
  const mediaRef = useRef(null);
  const cardRef = useRef(null);
  const [likes, setLikes] = useState(media.likes?.length || 0);
  const [liked, setLiked] = useState(
    currentUser?.id ? media.likes?.includes(currentUser.id) : false
  );
  const [commentCount, setCommentCount] = useState(media.comments?.length || 0);
  const [showModal, setShowModal] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const hasVideo = isVideoFile(media.audioFile);
  const isOwner = currentUser?.id === media.uploadedBy?._id;
  const hasVisualMedia = media.youtubeLink || hasVideo || media.coverPhoto;

  // Auto-stop when out of view
  function handlePlay() {
    if (currentlyPlaying && currentlyPlaying !== mediaRef.current) {
      currentlyPlaying.pause();
    }
    currentlyPlaying = mediaRef.current;
  }

  useEffect(() => {
    const card = cardRef.current;
    const media_el = mediaRef.current;
    if (!card || !media_el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !media_el.paused) {
          media_el.pause();
          if (currentlyPlaying === media_el) currentlyPlaying = null;
        }
      });
    }, { threshold: 0.2 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  async function handleLike() {
    if (!currentUser?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/music/${media._id}/like`, {
      method: "PUT", credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this media?")) return;
    const res = await fetch(`${apiUrl}/api/music/${media._id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) onDelete(media._id);
    else alert("Failed to delete");
  }

  function shareMedia() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: media.title, url });
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
  }

  const descLimit = 80;
  const isLongDesc = media.description && media.description.length > descLimit;

  return (
    <>
      <motion.div ref={cardRef} className="fb-card"
        style={{ position: "relative", background: "white", marginBottom: 1 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}>

        {/* CARD HEADER */}
        <div className="fb-card-header">
          <div className="fb-avatar">
            {media.uploadedBy?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="fb-author-info">
            <Link to={`/profile/${media.uploadedBy?._id}`} className="fb-author-name">
              {media.artist || media.uploadedBy?.username}
            </Link>
            <time className="fb-time">
              {format(new Date(media.createdAt), "MMM d, yyyy • h:mm a")}
            </time>
          </div>
          <span className="fb-badge">
            {media.category === "music" ? "🎵 Music" : "🎬 Video"}
          </span>
        </div>

        {/* TITLE + DESCRIPTION */}
        <div className="fb-card-body">
          <p className="fb-title">{media.title}</p>
          {media.description && (
            <p className="fb-summary">
              {descExpanded ? media.description : media.description.slice(0, descLimit)}
              {isLongDesc && (
                <button onClick={() => setDescExpanded(!descExpanded)}
                  style={{ background: "none", border: "none", color: "#CD853F", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", width: "auto", margin: 0, padding: 0, display: "inline" }}>
                  {descExpanded ? " ...less" : "... more"}
                </button>
              )}
            </p>
          )}
        </div>

        {/* MEDIA SECTION with TikTok buttons */}
        <div className="tiktok-media-wrapper">

          {/* YouTube embed */}
          {media.youtubeLink && (
            <div className="fb-card-image">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(media.youtubeLink)}`}
                title={media.title} frameBorder="0" allowFullScreen
                style={{ width: "100%", height: "56vw", maxHeight: "70vh", minHeight: 220, display: "block" }}
              />
            </div>
          )}

          {/* Cover photo (audio with cover) */}
          {media.coverPhoto && !media.youtubeLink && !hasVideo && (
            <div className="fb-card-image">
              <img src={`${apiUrl}/${media.coverPhoto}`} alt={media.title}
                style={{ width: "100%", maxHeight: "70vh", objectFit: "cover", display: "block" }} />
            </div>
          )}

          {/* Video file */}
          {media.audioFile && !media.youtubeLink && hasVideo && (
            <div className="fb-card-image" style={{ background: "#000" }}>
              <video ref={mediaRef} controls onPlay={handlePlay}
                style={{ width: "100%", maxHeight: "70vh", display: "block" }}>
                <source src={`${apiUrl}/${media.audioFile}`} type="video/mp4" />
                <source src={`${apiUrl}/${media.audioFile}`} />
              </video>
            </div>
          )}

          {/* Audio file (no cover) */}
          {media.audioFile && !media.youtubeLink && !hasVideo && !media.coverPhoto && (
            <div className="fb-audio-player">
              <div className="fb-audio-icon">🎵</div>
              <audio ref={mediaRef} controls onPlay={handlePlay} style={{ width: "100%", maxWidth: 320 }}>
                <source src={`${apiUrl}/${media.audioFile}`} />
              </audio>
            </div>
          )}

          {/* Audio file WITH cover photo — show cover + audio below */}
          {media.audioFile && !media.youtubeLink && !hasVideo && media.coverPhoto && (
            <div style={{ position: "relative" }}>
              {/* audio player below cover */}
              <div style={{ padding: "10px 16px", background: "#1a1209" }}>
                <audio ref={mediaRef} controls onPlay={handlePlay} style={{ width: "100%" }}>
                  <source src={`${apiUrl}/${media.audioFile}`} />
                </audio>
              </div>
            </div>
          )}

          {/* TIKTOK FLOATING BUTTONS on visual media */}
          {hasVisualMedia && (
            <div className="tiktok-actions">
              <motion.button
                className={`tiktok-btn ${liked ? "tiktok-liked" : ""}`}
                onClick={handleLike} whileTap={{ scale: 1.4 }}
                transition={{ type: "spring", stiffness: 400 }}>
                <span>{liked ? "❤️" : "🤍"}</span>
                <span className="tiktok-count">{likes}</span>
              </motion.button>

              <motion.button className="tiktok-btn"
                onClick={() => setShowModal(true)} whileTap={{ scale: 1.3 }}>
                <span>💬</span>
                <span className="tiktok-count">{commentCount}</span>
              </motion.button>

              <motion.button className="tiktok-btn"
                onClick={shareMedia} whileTap={{ scale: 1.3 }}>
                <span>📤</span>
                <span className="tiktok-count">Share</span>
              </motion.button>

              {isOwner && (
                <motion.button className="tiktok-btn"
                  onClick={handleDelete} whileTap={{ scale: 1.2 }}
                  style={{ background: "rgba(180,0,0,0.55)" }}>
                  <span>🗑️</span>
                  <span className="tiktok-count">Del</span>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Inline buttons for audio without visual */}
        {!hasVisualMedia && (
          <div style={{ display: "flex", gap: 16, padding: "8px 14px", justifyContent: "flex-end" }}>
            <motion.button onClick={handleLike} whileTap={{ scale: 1.3 }}
              style={{ background: "none", border: "none", cursor: "pointer", color: liked ? "#e0245e" : "#8B4513", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0 }}>
              {liked ? "❤️" : "🤍"} {likes}
            </motion.button>
            <motion.button onClick={() => setShowModal(true)} whileTap={{ scale: 1.2 }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8B4513", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0 }}>
              💬 {commentCount}
            </motion.button>
            <motion.button onClick={shareMedia} whileTap={{ scale: 1.2 }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8B4513", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0 }}>
              📤 Share
            </motion.button>
            {isOwner && (
              <motion.button onClick={handleDelete} whileTap={{ scale: 1.1 }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#cc0000", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 4, width: "auto", margin: 0, marginLeft: "auto" }}>
                🗑️ Del
              </motion.button>
            )}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <CommentsModal
            media={{ ...media, comments: media.comments || [] }}
            currentUser={currentUser}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ===== MAIN PAGE =====
export default function EntertainmentPage() {
  const [mediaList, setMediaList] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch(`${apiUrl}/api/music`)
      .then((res) => res.json())
      .then((data) => setMediaList(data));
  }, []);

  function handleDelete(id) {
    setMediaList(mediaList.filter((m) => m._id !== id));
  }

  const filtered = activeTab
    ? mediaList.filter((m) => m.category === activeTab)
    : mediaList;

  return (
    <div style={{ background: "#f0e8de", minHeight: "100vh", paddingBottom: 80 }}>

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>🎬 Entertainment</h2>
        <p>Music, videos and culture of the Adara people</p>
        {userInfo?.id && (
          <Link to="/entertainment/upload" className="create-btn">
            + Upload Media
          </Link>
        )}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 8, padding: "12px 14px", background: "white", borderBottom: "1px solid rgba(205,133,63,0.1)", overflowX: "auto" }}>
        {[
          { key: null, label: "🏠 All" },
          { key: "music", label: "🎵 Music" },
          { key: "video", label: "🎬 Video" },
        ].map(tab => (
          <button key={tab.key ?? "all"}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flexShrink: 0, padding: "7px 18px", borderRadius: 20, border: "2px solid rgba(205,133,63,0.2)",
              background: activeTab === tab.key ? "linear-gradient(135deg,#8B4513,#CD853F)" : "white",
              color: activeTab === tab.key ? "white" : "#8B4513",
              fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", fontWeight: 500,
              cursor: "pointer", width: "auto", margin: 0,
              boxShadow: activeTab === tab.key ? "0 3px 10px rgba(139,69,19,0.3)" : "none"
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* FEED */}
      {filtered.length === 0 ? (
        <p className="no-content">
          {activeTab ? `No ${activeTab} content yet!` : "No content yet. Be the first to upload!"}
        </p>
      ) : (
        <div>
          {filtered.map((media) => (
            <MediaCard
              key={media._id}
              media={media}
              currentUser={userInfo}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {!userInfo?.id && (
        <div className="register-prompt">
          <p>🪨 Enjoy the content? Join the Adara community!</p>
          <div className="login-required-buttons">
            <Link to="/register" className="create-btn">Register</Link>
            <Link to="/login" className="create-btn entertainment">Login</Link>
          </div>
        </div>
      )}
    </div>
  );
}
