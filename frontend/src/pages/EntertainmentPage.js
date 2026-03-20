import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import styles from "../styles/EntertainmentPage.module.css";

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

// COMMENTS MODAL
function CommentsModal({ media, currentUser, onClose }) {
  const [comments, setComments] = useState(media.comments || []);
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!currentUser?.id) { alert("Please login to comment"); return; }
    if (!comment.trim()) return;

    const res = await fetch(`${apiUrl}/api/music/${media._id}/comment`, {
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
      className={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modalBox}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHandle} />
        <div className={styles.modalHeader}>
          <h3>💬 Comments ({comments.length})</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.modalCommentsList}>
          {comments.length === 0 ? (
            <p className={styles.noComments}>No comments yet. Be the first!</p>
          ) : (
            comments.map((c, index) => (
              <div className={styles.comment} key={index}>
                <div className={styles.commentAuthor}>👤 {c.username}</div>
                <div className={styles.commentContent}>{c.content}</div>
                <div className={styles.commentDate}>
                  {formatISO9075(new Date(c.createdAt))}
                </div>
              </div>
            ))
          )}
        </div>
        {currentUser?.id ? (
          <form className={styles.commentForm} onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        ) : (
          <p className={styles.noComments}>
            <Link to="/login">Login</Link> to comment
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// MEDIA CARD
function MediaCard({ media, currentUser, onDelete }) {
  const [likes, setLikes] = useState(media.likes?.length || 0);
  const [liked, setLiked] = useState(
    currentUser?.id ? media.likes?.includes(currentUser.id) : false
  );
  const [commentCount, setCommentCount] = useState(media.comments?.length || 0);
  const [showModal, setShowModal] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const hasVideo = isVideoFile(media.audioFile);
  const isOwner = currentUser?.id === media.uploadedBy?._id;

  // Description truncation
  const descLimit = 80;
  const isLongDesc = media.description && media.description.length > descLimit;
  const displayDesc = showFullDesc
    ? media.description
    : media.description?.slice(0, descLimit);

  async function handleLike() {
    if (!currentUser?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/music/${media._id}/like`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this media?");
    if (!confirmed) return;
    const res = await fetch(`${apiUrl}/api/music/${media._id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) onDelete(media._id);
    else alert("Failed to delete");
  }

  function shareMedia() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: media.title, url });
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    }
  }

  return (
    <>
      <motion.div
        className={styles.musicCard}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -3, boxShadow: "0 12px 35px rgba(139,90,43,0.2)" }}
      >
        {/* ===== MEDIA SECTION ===== */}
        <div className={styles.mediaWrapper}>

          {/* Cover Photo */}
          {media.coverPhoto && !media.youtubeLink && !hasVideo && (
            <div className={styles.musicCover}>
              <img src={`${apiUrl}/${media.coverPhoto}`} alt={media.title} />
            </div>
          )}

          {/* YouTube */}
          {media.youtubeLink && (
            <div className={styles.videoPlayer}>
              <iframe
                width="100%"
                height="220"
                src={`https://www.youtube.com/embed/${getYoutubeId(media.youtubeLink)}`}
                title={media.title}
                frameBorder="0"
                allowFullScreen
              />
            </div>
          )}

          {/* Video - controls at bottom, buttons won't overlap */}
          {media.audioFile && !media.youtubeLink && hasVideo && (
            <div className={styles.videoPlayer}>
              <video
                controls
                style={{ width: "100%", display: "block" }}
              >
                <source src={`${apiUrl}/${media.audioFile}`} type="video/mp4" />
                <source src={`${apiUrl}/${media.audioFile}`} />
              </video>
            </div>
          )}

          {/* Audio */}
          {media.audioFile && !media.youtubeLink && !hasVideo && (
            <div className={styles.audioPlayer}>
              <div className={styles.audioIcon}>🎵</div>
              <audio controls style={{ width: "100%" }}>
                <source src={`${apiUrl}/${media.audioFile}`} />
              </audio>
            </div>
          )}

          {/* TIKTOK BUTTONS - positioned on RIGHT SIDE, middle of media
              NOT at bottom so they don't cover video controls */}
          {(media.youtubeLink || hasVideo || media.coverPhoto) && (
            <div className={styles.tikTokActions}>
              <motion.button
                className={`${styles.tikTokBtn} ${liked ? styles.tikTokLiked : ""}`}
                onClick={handleLike}
                whileTap={{ scale: 1.4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <span>{liked ? "❤️" : "🤍"}</span>
                <span className={styles.tikTokCount}>{likes}</span>
              </motion.button>

              <motion.button
                className={styles.tikTokBtn}
                onClick={() => setShowModal(true)}
                whileTap={{ scale: 1.3 }}
              >
                <span>💬</span>
                <span className={styles.tikTokCount}>{commentCount}</span>
              </motion.button>

              <motion.button
                className={styles.tikTokBtn}
                onClick={shareMedia}
                whileTap={{ scale: 1.3 }}
              >
                <span>📤</span>
                <span className={styles.tikTokCount}>Share</span>
              </motion.button>
            </div>
          )}
        </div>

        {/* ===== INFO SECTION ===== */}
        <div className={styles.musicInfo}>
          <div className={styles.infoTop}>
            <span className={styles.musicCategory}>{media.category}</span>
            {/* Delete button here - away from video controls */}
            {isOwner && (
              <motion.button
                className={styles.deleteMediaBtn}
                onClick={handleDelete}
                whileTap={{ scale: 1.1 }}
              >
                🗑️
              </motion.button>
            )}
          </div>

          <h3>{media.title}</h3>

          {media.artist && (
            <p className={styles.musicArtist}>🎤 {media.artist}</p>
          )}
          <p className={styles.musicArtist}>
            By{" "}
            <Link to={`/profile/${media.uploadedBy?._id}`}>
              {media.uploadedBy?.username}
            </Link>
          </p>

          {/* Truncated description with See more */}
          {media.description && (
            <p className={styles.musicDescription}>
              {displayDesc}
              {isLongDesc && !showFullDesc && "... "}
              {isLongDesc && (
                <button
                  className={styles.seeMoreBtn}
                  onClick={() => setShowFullDesc(!showFullDesc)}
                >
                  {showFullDesc ? " See less" : "See more"}
                </button>
              )}
            </p>
          )}

          <p className={styles.musicDate}>
            {formatISO9075(new Date(media.createdAt))}
          </p>
        </div>

        {/* FOOTER ACTIONS for audio cards */}
        {!media.youtubeLink && !hasVideo && !media.coverPhoto && (
          <div className={styles.mediaActions}>
            <motion.button
              className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
              onClick={handleLike}
              whileTap={{ scale: 1.2 }}
            >
              {liked ? "❤️" : "🤍"} {likes}
            </motion.button>
            <motion.button
              className={styles.commentToggleBtn}
              onClick={() => setShowModal(true)}
              whileTap={{ scale: 1.1 }}
            >
              💬 {commentCount}
            </motion.button>
            <motion.button
              className={styles.commentToggleBtn}
              onClick={shareMedia}
              whileTap={{ scale: 1.1 }}
            >
              📤 Share
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* COMMENTS MODAL */}
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
    <div className={styles.entertainmentPage}>

      <div className="page-header">
        <h2>🎬 Entertainment</h2>
        <p>Music, videos and culture of the Adara people</p>
        {userInfo?.id && (
          <Link to="/entertainment/upload" className="create-btn">
            + Upload Media
          </Link>
        )}
      </div>

      <div className={styles.entertainmentTabs}>
        <button className={activeTab === null ? styles.active : ""}
          onClick={() => setActiveTab(null)}>🏠 All</button>
        <button className={activeTab === "music" ? styles.active : ""}
          onClick={() => setActiveTab("music")}>🎵 Music</button>
        <button className={activeTab === "video" ? styles.active : ""}
          onClick={() => setActiveTab("video")}>🎬 Video</button>
      </div>

      {filtered.length === 0 ? (
        <p className="no-content">
          {activeTab ? `No ${activeTab} content yet!` : "No content yet. Be the first to upload!"}
        </p>
      ) : (
        <div className={styles.musicGrid}>
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
