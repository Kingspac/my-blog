import { useState, useEffect, useContext, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format, formatISO9075 } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "../UserContext";
import Post from "../Post.js";
import styles from "../styles/ProfilePage.module.css";

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
function CommentsModal({ mediaId, comments: initialComments, onClose, currentUser }) {
  const [comments, setComments] = useState(initialComments || []);
  const [comment, setComment] = useState("");

  async function handleComment(e) {
    e.preventDefault();
    if (!currentUser?.id) { alert("Please login"); return; }
    if (!comment.trim()) return;
    const res = await fetch(`${apiUrl}/api/music/${mediaId}/comment`, {
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
        <div className="modal-header">
          <h3>💬 Comments ({comments.length})</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-comments-list">
          {comments.length === 0 ? (
            <p className="no-comments-text">No comments yet!</p>
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
          <p className="modal-login-prompt"><Link to="/login">Login</Link> to comment</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ===== MEDIA CARD with full functionality =====
function MediaCard({ item, isOwnProfile, onDelete }) {
  const mediaRef = useRef(null);
  const cardRef = useRef(null);
  const { userInfo } = useContext(UserContext);
  const [likes, setLikes] = useState(item.likes?.length || 0);
  const [liked, setLiked] = useState(userInfo?.id ? item.likes?.includes(userInfo.id) : false);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState(item.comments || []);

  function handlePlay() {
    if (currentlyPlaying && currentlyPlaying !== mediaRef.current) currentlyPlaying.pause();
    currentlyPlaying = mediaRef.current;
  }

  useEffect(() => {
    const card = cardRef.current;
    const media = mediaRef.current;
    if (!card || !media) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !media.paused) {
          media.pause();
          if (currentlyPlaying === media) currentlyPlaying = null;
        }
      });
    }, { threshold: 0.2 });
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  async function handleLike() {
    if (!userInfo?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/music/${item._id}/like`, {
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
    const res = await fetch(`${apiUrl}/api/music/${item._id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) onDelete(item._id);
    else alert("Failed to delete");
  }

  function shareMedia() {
    const url = window.location.href;
    if (navigator.share) navigator.share({ title: item.title, url });
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
  }

  const hasVideo = isVideoFile(item.audioFile);
  const hasMedia = item.audioFile || item.youtubeLink;

  return (
    <>
      <motion.div ref={cardRef} className="fb-card tiktok-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.4 }}>

        <div className="fb-card-header">
          <div className="fb-avatar">{item.uploadedBy?.username?.charAt(0).toUpperCase()}</div>
          <div className="fb-author-info">
            <Link to={`/profile/${item.uploadedBy?._id}`} className="fb-author-name">
              {item.artist || item.uploadedBy?.username}
            </Link>
            <time className="fb-time">{format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}</time>
          </div>
          <span className="fb-badge">{item.category === "music" ? "🎵 Music" : "🎬 Video"}</span>
        </div>

        <div className="fb-card-body">
          <p className="fb-title">{item.title}</p>
          {item.description && <p className="fb-summary">{item.description}</p>}
        </div>

        <div className="tiktok-media-wrapper">
          {item.coverPhoto && !item.youtubeLink && !hasVideo && (
            <div className="fb-card-image">
              <img src={`${apiUrl}/${item.coverPhoto}`} alt={item.title} />
            </div>
          )}
          {item.youtubeLink && (
            <div className="fb-card-image">
              <iframe width="100%" height="280"
                src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                title={item.title} frameBorder="0" allowFullScreen style={{ display: "block" }} />
            </div>
          )}
          {item.audioFile && !item.youtubeLink && hasVideo && (
            <div className="fb-card-image" style={{ background: "#000" }}>
              <video ref={mediaRef} controls onPlay={handlePlay}
                style={{ width: "100%", display: "block", maxHeight: "360px" }}>
                <source src={`${apiUrl}/${item.audioFile}`} type="video/mp4" />
              </video>
            </div>
          )}
          {item.audioFile && !item.youtubeLink && !hasVideo && (
            <div className="fb-audio-player">
              <div className="fb-audio-icon">🎵</div>
              <audio ref={mediaRef} controls onPlay={handlePlay} style={{ flex: 1 }}>
                <source src={`${apiUrl}/${item.audioFile}`} />
              </audio>
            </div>
          )}
          {hasMedia && (
            <div className="tiktok-actions">
              <motion.button className={`tiktok-btn ${liked ? "tiktok-liked" : ""}`}
                onClick={handleLike} whileTap={{ scale: 1.3 }}
                transition={{ type: "spring", stiffness: 400 }}>
                <span>{liked ? "❤️" : "🤍"}</span>
                <span className="tiktok-count">{likes}</span>
              </motion.button>
              <motion.button className="tiktok-btn"
                onClick={() => setShowModal(true)} whileTap={{ scale: 1.2 }}>
                <span>💬</span>
                <span className="tiktok-count">{comments.length}</span>
              </motion.button>
              <motion.button className="tiktok-btn"
                onClick={shareMedia} whileTap={{ scale: 1.2 }}>
                <span>📤</span>
                <span className="tiktok-count">Share</span>
              </motion.button>
              {isOwnProfile && (
                <motion.button className="tiktok-btn"
                  onClick={handleDelete} whileTap={{ scale: 1.1 }}
                  style={{ background: "rgba(180,0,0,0.5)" }}>
                  <span>🗑️</span>
                  <span className="tiktok-count">Del</span>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {item.audioFile && !hasVideo && (
          <div className="fb-card-footer">
            <motion.button className={`fb-action-btn ${liked ? "fb-liked" : ""}`}
              onClick={handleLike} whileTap={{ scale: 1.2 }}>
              <span>{liked ? "❤️" : "🤍"}</span> {likes}
            </motion.button>
            <motion.button className="fb-action-btn"
              onClick={() => setShowModal(true)} whileTap={{ scale: 1.1 }}>
              <span>💬</span> {comments.length}
            </motion.button>
            <motion.button className="fb-action-btn"
              onClick={shareMedia} whileTap={{ scale: 1.1 }}>
              <span>📤</span> Share
            </motion.button>
            {isOwnProfile && (
              <motion.button className="fb-action-btn"
                onClick={handleDelete} whileTap={{ scale: 1.1 }}
                style={{ color: "#cc0000", marginLeft: "auto" }}>
                🗑️ Delete
              </motion.button>
            )}
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


export default function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [music, setMusic] = useState([]);

  const { id } = useParams();
  const { userInfo, setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const isOwnProfile = userInfo?.id === id;
  const [pendingPosts, setPendingPosts] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        setBio(data.user.bio || "");
      });

    fetch(`${apiUrl}/api/music`)
      .then((res) => res.json())
      .then((data) => {
        setMusic(data.filter((m) => m.uploadedBy?._id === id || m.uploadedBy === id));
      });

    // Only check admin if viewing own profile
    if (userInfo?.id === id) {
      fetch(`${apiUrl}/api/education/admin/pending`, {
        credentials: "include",
      })
        .then((res) => {
          // Only set admin if server confirms (200 OK)
          // Non-admins get 403 → isAdmin stays false
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data && Array.isArray(data)) {
            setPendingPosts(data);
            setIsAdmin(true); // only true if server said OK
          }
          // If null (403), isAdmin stays false → panel hidden
        })
        .catch(() => {});
    }
  }, [id]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      setFileError("Photo too large! Max 5MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setProfilePhoto(e.target.files);
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append("bio", bio);
    if (profilePhoto && profilePhoto[0]) formData.append("profilePhoto", profilePhoto[0]);

    const response = await fetch(`${apiUrl}/api/profile/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setProfileData((prev) => ({ ...prev, user: updatedUser }));
      setIsEditing(false);
      alert("Profile updated!");
    } else {
      alert("Failed to update profile");
    }
  }

  function logout() {
    fetch(`${apiUrl}/api/logout`, { credentials: "include", method: "POST" });
    setUserInfo(null);
    navigate("/");
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteError, setDeleteError] = useState("");

  function openDeleteModal() {
    // Generate random 6-char code like GitHub
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setDeleteCode(code);
    setConfirmInput("");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  async function confirmDeleteAccount() {
    if (confirmInput !== deleteCode) {
      setDeleteError("❌ Code does not match! Please type the exact code shown.");
      return;
    }

    const res = await fetch(`${apiUrl}/api/account`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setShowDeleteModal(false);
      setUserInfo(null);
      navigate("/");
    } else {
      setDeleteError("Failed to delete account. Please try again.");
    }
  }

  // Delete own blog post
  async function deletePost(postId) {
    if (!window.confirm("Delete this post?")) return;
    const res = await fetch(`${apiUrl}/api/post/${postId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setProfileData(prev => ({
        ...prev,
        posts: prev.posts.filter(p => p._id !== postId)
      }));
      setMusic(prev => prev.filter(m => m._id !== postId));
    } else {
      alert("Failed to delete post");
    }
  }

  // Delete own media
  async function deleteMedia(mediaId) {
    if (!window.confirm("Delete this media?")) return;
    const res = await fetch(`${apiUrl}/api/music/${mediaId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setMusic(prev => prev.filter(m => m._id !== mediaId));
    } else {
      alert("Failed to delete media");
    }
  }

  async function approvePost(postId) {
    const res = await fetch(`${apiUrl}/api/education/${postId}/approve`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      setPendingPosts(pendingPosts.filter(p => p._id !== postId));
    }
  }

  async function rejectPost(postId) {
    const note = window.prompt("Reason for rejection (optional):");
    const res = await fetch(`${apiUrl}/api/education/${postId}/reject`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewNote: note || "" }),
    });
    if (res.ok) {
      setPendingPosts(pendingPosts.filter(p => p._id !== postId));
    }
  }

  function handleMediaDelete(mediaId) {
    setMusic(prev => prev.filter(m => m._id !== mediaId));
  }

  if (!profileData) return "";

  const { user, posts } = profileData;

  const mixedContent = [
    ...posts.map((p) => ({ ...p, itemType: "post" })),
    ...music.map((m) => ({ ...m, itemType: "media" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className={styles.profilePage}>

      {/* PROFILE HEADER */}
      <div className={styles.profileHeader}>
        <div className={styles.profilePhoto}>
          {user.profilePhoto ? (
            <img src={`${apiUrl}/${user.profilePhoto}`} alt="profile" />
          ) : (
            <div className={styles.profilePhotoPlaceholder}>👤</div>
          )}
        </div>

        <h2 className={styles.profileUsername}>{user.username}</h2>
        <p className={styles.profileBio}>{user.bio || "No bio yet."}</p>

        {isOwnProfile && (
          <div className={styles.profileActions}>
            {!isEditing && (
              <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                ✏️ Edit
              </button>
            )}
            <button className={styles.logoutBtn} onClick={logout}>
              🚪 Logout
            </button>
          </div>
        )}

        {isOwnProfile && (
          <div className={styles.profileCreateButtons}>
            <Link to="/create" className="create-btn">📝 Create Post</Link>
            <Link to="/entertainment/upload" className="create-btn entertainment">🎵 Upload Media</Link>
          </div>
        )}

        {isOwnProfile && (
          <button className={styles.deleteAccountBtn} onClick={openDeleteModal}>
            🗑️ Delete Account
          </button>
        )}
      </div>

      {/* EDIT PROFILE FORM */}
      {isOwnProfile && isEditing && (
        <form className={styles.editProfileForm} onSubmit={handleUpdateProfile}>
          <h3>Edit Profile</h3>
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {fileError && <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>}
          <label>Bio</label>
          <textarea
            placeholder="Tell the Adara community about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
          <div className="edit-profile-buttons">
            <button type="submit">Save Changes</button>
            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ===== DELETE ACCOUNT MODAL ===== */}
      {showDeleteModal && (
        <div className={styles.deleteModalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.deleteModalBox} onClick={(e) => e.stopPropagation()}>

            {/* Warning icon */}
            <div className={styles.deleteModalIcon}>⚠️</div>

            <h3 className={styles.deleteModalTitle}>Delete Account</h3>

            <p className={styles.deleteModalText}>
              This will <strong>permanently delete</strong> your account,
              all your posts and all uploaded media.
              <br /><br />
              <strong>This action cannot be undone.</strong>
            </p>

            {/* What will be deleted */}
            <div className={styles.deleteModalList}>
              <span>🗑️ Your account & profile</span>
              <span>📝 All your blog posts</span>
              <span>🎵 All your uploaded media</span>
            </div>

            {/* Confirmation code */}
            <div className={styles.deleteCodeBox}>
              <p className={styles.deleteCodeLabel}>
                To confirm, type this code exactly:
              </p>
              <div className={styles.deleteCode}>{deleteCode}</div>
            </div>

            <input
              className={styles.deleteCodeInput}
              type="text"
              placeholder="Type the code here..."
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                setDeleteError("");
              }}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {deleteError && (
              <p className={styles.deleteError}>{deleteError}</p>
            )}

            <div className={styles.deleteModalButtons}>
              <button
                className={styles.deleteCancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles.deleteConfirmBtn} ${confirmInput === deleteCode ? styles.deleteConfirmActive : ""}`}
                onClick={confirmDeleteAccount}
                disabled={confirmInput !== deleteCode}
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADMIN PANEL - pending posts ===== */}
      {isAdmin && pendingPosts.length > 0 && (
        <div className={styles.adminPanel}>
          <h3 className={styles.adminPanelTitle}>
            🛡️ Admin — Pending Approval ({pendingPosts.length})
          </h3>
          {pendingPosts.map((post) => (
            <div key={post._id} className={styles.pendingCard}>
              <div className={styles.pendingInfo}>
                <span className={styles.pendingCategory}>{post.category}</span>
                <span className={styles.pendingTitle}>{post.title}</span>
                <span className={styles.pendingAuthor}>
                  by {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.pendingActions}>
                <button
                  className={styles.approveBtn}
                  onClick={() => approvePost(post._id)}
                >✅ Approve</button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => rejectPost(post._id)}
                >❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && isOwnProfile && pendingPosts.length === 0 && (
        <div className={styles.adminPanelEmpty}>
          🛡️ Admin Panel — No pending posts to review ✅
        </div>
      )}


      {/* MIXED CONTENT FEED - using working components */}
      <div className={styles.profileFeed}>
        <h3 className={styles.feedTitle}>
          {user.username}'s Content ({mixedContent.length})
        </h3>

        {mixedContent.length === 0 ? (
          <p className="no-content">No content yet.</p>
        ) : (
          mixedContent.map((item) => (
            <div key={item._id}>
              {item.itemType === "post" && (
                <Post {...item} variant="feed" />
              )}
              {item.itemType === "media" && (
                <MediaCard item={item} isOwnProfile={isOwnProfile} onDelete={handleMediaDelete} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
