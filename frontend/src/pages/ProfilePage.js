import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatISO9075, format } from "date-fns";
import { motion } from "framer-motion";
import { UserContext } from "../UserContext";
import styles from "../styles/ProfilePage.module.css";

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isVideoFile(filename) {
  if (!filename) return false;
  const ext = filename.split(".").pop().toLowerCase();
  return ["mp4", "webm", "ogg", "mov", "mkv"].includes(ext);
}

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

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

      {/* MIXED CONTENT FEED */}
      <div className={styles.profileFeed}>
        <h3 className={styles.feedTitle}>
          {user.username}'s Content ({mixedContent.length})
        </h3>

        {mixedContent.length === 0 ? (
          <p className="no-content">No content yet.</p>
        ) : (
          mixedContent.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4 }}
            >
              {/* ===== BLOG POST CARD - same as home page ===== */}
              {item.itemType === "post" && (
                <div className="fb-card tiktok-card">
                  {/* Header */}
                  <div className="fb-card-header">
                    <div className="fb-avatar">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="fb-author-info">
                      <span className="fb-author-name">{user.username}</span>
                      <time className="fb-time">
                        {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                      </time>
                    </div>
                    <span className="fb-badge">📝 Blog</span>
                  </div>

                  {/* Title */}
                  <div className="fb-card-body">
                    <Link to={`/post/${item._id}`} className="fb-title">
                      {item.title}
                    </Link>
                    {item.summary && (
                      <p className="fb-summary">{item.summary}</p>
                    )}
                  </div>

                  {/* Cover image - wrapped in link */}
                  {item.cover && (
                    <Link to={`/post/${item._id}`}>
                      <div className="fb-card-image">
                        <img src={`${apiUrl}/${item.cover}`} alt={item.title} />
                      </div>
                    </Link>
                  )}

                  {/* Footer */}
                  <div className="fb-card-footer">
                    <Link to={`/post/${item._id}`} className="fb-action-btn">
                      <span>👍</span> Like
                    </Link>
                    <Link to={`/post/${item._id}`} className="fb-action-btn">
                      <span>💬</span> Comment
                    </Link>
                    <Link to={`/post/${item._id}`} className="fb-action-btn">
                      <span>📤</span> Share
                    </Link>
                  </div>
                </div>
              )}

              {/* ===== MEDIA CARD - same as home page ===== */}
              {item.itemType === "media" && (
                <div className="fb-card">
                  {/* Header */}
                  <div className="fb-card-header">
                    <div className="fb-avatar">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="fb-author-info">
                      <span className="fb-author-name">{user.username}</span>
                      <time className="fb-time">
                        {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                      </time>
                    </div>
                    <span className="fb-badge">
                      {item.category === "music" ? "🎵 Music" : "🎬 Video"}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="fb-card-body">
                    <p className="fb-title">{item.title}</p>
                    {item.description && (
                      <p className="fb-summary">{item.description}</p>
                    )}
                  </div>

                  {/* Cover photo */}
                  {item.coverPhoto && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                    <div className="fb-card-image">
                      <img src={`${apiUrl}/${item.coverPhoto}`} alt={item.title} />
                    </div>
                  )}

                  {/* YouTube */}
                  {item.youtubeLink && (
                    <div className="fb-card-image">
                      <iframe
                        width="100%" height="240"
                        src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                        title={item.title} frameBorder="0" allowFullScreen
                        style={{ display: "block" }}
                      />
                    </div>
                  )}

                  {/* Video */}
                  {item.audioFile && !item.youtubeLink && isVideoFile(item.audioFile) && (
                    <div className="fb-card-image" style={{ background: "#000" }}>
                      <video controls style={{ width: "100%", display: "block" }}>
                        <source src={`${apiUrl}/${item.audioFile}`} type="video/mp4" />
                        <source src={`${apiUrl}/${item.audioFile}`} />
                      </video>
                    </div>
                  )}

                  {/* Audio */}
                  {item.audioFile && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                    <div className="fb-audio-player">
                      <div className="fb-audio-icon">🎵</div>
                      <audio controls style={{ flex: 1 }}>
                        <source src={`${apiUrl}/${item.audioFile}`} />
                      </audio>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="fb-card-footer">
                    <button className="fb-action-btn"><span>👍</span> Like</button>
                    <button className="fb-action-btn"><span>💬</span> Comment</button>
                    <button className="fb-action-btn"><span>📤</span> Share</button>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
