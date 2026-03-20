import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";
import styles from "../styles/ProfilePage.module.css";
import mediaStyles from "../styles/IndexPage.module.css";

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
        const userMusic = data.filter(
          (m) => m.uploadedBy?._id === id || m.uploadedBy === id
        );
        setMusic(userMusic);
      });
  }, [id]);

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
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
    if (profilePhoto && profilePhoto[0]) {
      formData.append("profilePhoto", profilePhoto[0]);
    }

    const response = await fetch(`${apiUrl}/api/profile/${id}`, {
      method: "PUT",
      credentials: "include",
      body: formData,
    });

    if (response.ok) {
      const updatedUser = await response.json();
      setProfileData((prev) => ({ ...prev, user: updatedUser }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } else {
      alert("Failed to update profile");
    }
  }

  // LOGOUT from profile page
  function logout() {
    fetch(`${apiUrl}/api/logout`, {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
    navigate("/");
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

        {/* Profile Photo */}
        <div className={styles.profilePhoto}>
          {user.profilePhoto ? (
            <img
              src={`${apiUrl}/${user.profilePhoto}`}
              alt="profile"
            />
          ) : (
            <div className={styles.profilePhotoPlaceholder}>👤</div>
          )}
        </div>

        {/* Username */}
        <h2 className={styles.profileUsername}>{user.username}</h2>

        {/* Bio */}
        <p className={styles.profileBio}>{user.bio || "No bio yet."}</p>

        {/* Edit button */}
        {isOwnProfile && !isEditing && (
          <button
            className={styles.editProfileBtn}
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}

        {/* Logout button - only on own profile */}
        {isOwnProfile && (
          <button
            className={styles.logoutBtn}
            onClick={logout}
          >
            🚪 Logout
          </button>
        )}

        {/* Create buttons */}
        {isOwnProfile && (
          <div className={styles.profileCreateButtons}>
            <Link to="/create" className="create-btn">
              📝 Create Post
            </Link>
            <Link to="/entertainment/upload" className="create-btn entertainment">
              🎵 Upload Media
            </Link>
          </div>
        )}
      </div>

      {/* EDIT PROFILE FORM */}
      {isOwnProfile && isEditing && (
        <form className={styles.editProfileForm} onSubmit={handleUpdateProfile}>
          <h3>Edit Profile</h3>

          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          {fileError && (
            <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
          )}

          <label>Bio</label>
          <textarea
            placeholder="Tell the Adara community about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />

          <div className="edit-profile-buttons">
            <button type="submit">Save Changes</button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* MIXED CONTENT FEED */}
      <div className="profile-posts">
        <h3>{user.username}'s Content ({mixedContent.length})</h3>

        {mixedContent.length === 0 ? (
          <p className="no-content">No content yet.</p>
        ) : (
          mixedContent.map((item) => (
            <div key={item._id}>

              {/* Blog Post */}
              {item.itemType === "post" && (
                <div className="post">
                  <div>
                    <img
                      src={`${apiUrl}/${item.cover}`}
                      alt="post cover"
                    />
                  </div>
                  <div className="text">
                    <Link to={`/post/${item._id}`}>
                      <h2>{item.title}</h2>
                    </Link>
                    <p className="info">
                      <time>{formatISO9075(new Date(item.createdAt))}</time>
                    </p>
                    <p className="summary">{item.summary}</p>
                  </div>
                </div>
              )}

              {/* Media Card */}
              {item.itemType === "media" && (
                <div className={mediaStyles.mediaCard}>

                  {/* Cover photo - only for audio */}
                  {item.coverPhoto && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                    <div className={mediaStyles.mediaCover}>
                      <img
                        src={`${apiUrl}/${item.coverPhoto}`}
                        alt={item.title}
                      />
                    </div>
                  )}

                  {/* YouTube embed */}
                  {item.youtubeLink && (
                    <div className="youtube-embed">
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                        title={item.title}
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {/* VIDEO player - fixed! */}
                  {item.audioFile && !item.youtubeLink && isVideoFile(item.audioFile) && (
                    <video
                      controls
                      style={{ width: "100%", display: "block", background: "#000" }}
                    >
                      <source src={`${apiUrl}/${item.audioFile}`} type="video/mp4" />
                      Your browser does not support video.
                    </video>
                  )}

                  {/* AUDIO player */}
                  {item.audioFile && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                    <div style={{ padding: "10px", background: "#f9f9f9" }}>
                      <audio controls style={{ width: "100%" }}>
                        <source src={`${apiUrl}/${item.audioFile}`} />
                      </audio>
                    </div>
                  )}

                  <div className={mediaStyles.mediaInfo}>
                    <span className={mediaStyles.mediaBadge}>{item.category}</span>
                    <h3>{item.title}</h3>
                    <p className={mediaStyles.mediaDate}>
                      {formatISO9075(new Date(item.createdAt))}
                    </p>
                  </div>
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
}
