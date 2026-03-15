import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";
import styles from "../styles/EntertainmentPage.module.css";

// Helper to extract YouTube video ID
function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// Check if file is a video by extension
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
    if (!currentUser?.id) {
      alert("Please login to comment");
      return;
    }
    if (!comment.trim()) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/music/${media._id}/comment`, {
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
    // Dark overlay behind modal
    <div className={styles.modalOverlay} onClick={onClose}>
      {/* Modal box - stop click from closing when clicking inside */}
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h3>💬 Comments ({comments.length})</h3>
          <button className={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>

        {/* Comments list */}
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

        {/* Comment form */}
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
      </div>
    </div>
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

  const hasVideo = isVideoFile(media.audioFile);
  const isOwner = currentUser?.id === media.uploadedBy?._id;
  const mediaURL = window.location.href;

  async function handleLike() {
    if (!currentUser?.id) {
      alert("Please login to like");
      return;
    }
    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/music/${media._id}/like`, {
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
    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/music/${media._id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      onDelete(media._id);
    } else {
      alert("Failed to delete");
    }
  }

  function shareToWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`"${media.title}" on Enchwra: ${mediaURL}`)}`, "_blank");
  }
  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mediaURL)}`, "_blank");
  }
  function shareToTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${media.title}" on Enchwra`)}&url=${encodeURIComponent(mediaURL)}`, "_blank");
  }
  function copyLink() {
    navigator.clipboard.writeText(mediaURL);
    alert("Link copied!");
  }

  return (
    <>
      <div className={styles.musicCard}>

        {/* Cover Photo */}
        {media.coverPhoto && !media.youtubeLink && !hasVideo && (
          <div className={styles.musicCover}>
            <img src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${media.coverPhoto}`} alt={media.title} />
          </div>
        )}

        {/* YouTube Embed */}
        {media.youtubeLink && (
          <div className="youtube-embed">
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

        {/* VIDEO player */}
        {media.audioFile && !media.youtubeLink && hasVideo && (
          <div className={styles.videoPlayer}>
            <video controls style={{ width: "100%" }}>
              <source src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${media.audioFile}`} type="video/mp4" />
              Your browser does not support video.
            </video>
          </div>
        )}

        {/* AUDIO player */}
        {media.audioFile && !media.youtubeLink && !hasVideo && (
          <div className={styles.audioPlayer}>
            <audio controls style={{ width: "100%" }}>
              <source src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${media.audioFile}`} />
              Your browser does not support audio.
            </audio>
          </div>
        )}

        {/* Info */}
        <div className={styles.musicInfo}>
          <span className={styles.musicCategory}>{media.category}</span>
          <h3>{media.title}</h3>
          {media.artist && (
            <p className={styles.musicArtist}>🎤 {media.artist}</p>
          )}
          <p className={styles.musicArtist}>
            Uploaded by{" "}
            <Link to={`/profile/${media.uploadedBy?._id}`}>
              {media.uploadedBy?.username}
            </Link>
          </p>
          {media.description && (
            <p className={styles.musicDescription}>{media.description}</p>
          )}
          <p className={styles.musicDate}>
            {formatISO9075(new Date(media.createdAt))}
          </p>
        </div>

        {/* ACTIONS ROW */}
        <div className={styles.mediaActions}>
          <button
            className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
            onClick={handleLike}
          >
            {liked ? "❤️" : "🤍"} {likes}
          </button>

          {/* Comment button opens modal */}
          <button
            className={styles.commentToggleBtn}
            onClick={() => setShowModal(true)}
          >
            💬 {commentCount}
          </button>

          {isOwner && (
            <button className={styles.deleteMediaBtn} onClick={handleDelete}>
              🗑️ Delete
            </button>
          )}
        </div>

        {/* SHARE ROW */}
        <div className={styles.shareRow}>
          <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={shareToWhatsApp}>📱</button>
          <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={shareToFacebook}>📘</button>
          <button className={`${styles.shareBtn} ${styles.twitter}`} onClick={shareToTwitter}>🐦</button>
          <button className={`${styles.shareBtn} ${styles.copy}`} onClick={copyLink}>🔗</button>
        </div>
      </div>

      {/* COMMENTS MODAL - shows on top of everything */}
      {showModal && (
        <CommentsModal
          media={{ ...media, comments: media.comments || [] }}
          currentUser={currentUser}
          onClose={() => {
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

export default function EntertainmentPage() {
  const [mediaList, setMediaList] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/music`)
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
        <button
          className={activeTab === null ? styles.active : ""}
          onClick={() => setActiveTab(null)}
        >
          🏠 All
        </button>
        <button
          className={activeTab === "music" ? styles.active : ""}
          onClick={() => setActiveTab("music")}
        >
          🎵 Music
        </button>
        <button
          className={activeTab === "video" ? styles.active : ""}
          onClick={() => setActiveTab("video")}
        >
          🎬 Video
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="no-content">
          {activeTab
            ? `No ${activeTab} content yet. Be the first to upload!`
            : "No content yet. Be the first to upload!"}
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
