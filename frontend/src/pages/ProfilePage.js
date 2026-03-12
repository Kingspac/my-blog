import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";

// Helper to extract YouTube video ID
function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [music, setMusic] = useState([]);

  const { id } = useParams();
  const { userInfo } = useContext(UserContext);

  // Is the logged in user viewing their OWN profile?
  const isOwnProfile = userInfo?.id === id;

  useEffect(() => {
    // Fetch user profile + their posts
    fetch(`http://localhost:4000/api/profile/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        setBio(data.user.bio || "");
      });

    // Fetch all music and filter by this user on frontend
    fetch("http://localhost:4000/api/music")
      .then((res) => res.json())
      .then((data) => {
        // Only keep music uploaded by this user
        const userMusic = data.filter(
          (m) => m.uploadedBy?._id === id || m.uploadedBy === id
        );
        setMusic(userMusic);
      });
  }, [id]);

  // FILE VALIDATION for profile photo
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError("Photo too large! Max 5MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setProfilePhoto(e.target.files);
  }

  // UPDATE PROFILE
  async function handleUpdateProfile(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("bio", bio);
    if (profilePhoto && profilePhoto[0]) {
      formData.append("profilePhoto", profilePhoto[0]);
    }

    const response = await fetch(`http://localhost:4000/api/profile/${id}`, {
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

  if (!profileData) return "";

  const { user, posts } = profileData;

  // Mix posts and music together sorted by date
  const mixedContent = [
    ...posts.map((p) => ({ ...p, itemType: "post" })),
    ...music.map((m) => ({ ...m, itemType: "media" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="profile-page">

      {/* PROFILE HEADER */}
      <div className="profile-header">
        {/* Profile Photo */}
        <div className="profile-photo">
          {user.profilePhoto ? (
            <img
              src={`http://localhost:4000/${user.profilePhoto}`}
              alt="profile"
            />
          ) : (
            <div className="profile-photo-placeholder">👤</div>
          )}
        </div>

        {/* Username */}
        <h2>{user.username}</h2>

        {/* Bio */}
        <p className="profile-bio">{user.bio || "No bio yet."}</p>

        {/* Edit button - only on own profile */}
        {isOwnProfile && !isEditing && (
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}

        {/* Create buttons - only on own profile */}
        {isOwnProfile && (
          <div className="profile-create-buttons">
            <Link to="/create" className="create-btn">
              📝 Create Post
            </Link>
            <Link to="/entertainment/upload" className="create-btn entertainment">
              🎵 Upload Entertainment
            </Link>
          </div>
        )}
      </div>

      {/* EDIT PROFILE FORM */}
      {isOwnProfile && isEditing && (
        <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
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
                      src={`http://localhost:4000/${item.cover}`}
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
                <div className="media-card">
                  {item.coverPhoto && !item.youtubeLink && (
                    <div className="media-cover">
                      <img
                        src={`http://localhost:4000/${item.coverPhoto}`}
                        alt={item.title}
                      />
                    </div>
                  )}

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

                  {item.audioFile && !item.youtubeLink && (
                    <div className="audio-player">
                      <audio controls style={{ width: "100%" }}>
                        <source
                          src={`http://localhost:4000/${item.audioFile}`}
                        />
                      </audio>
                    </div>
                  )}

                  <div className="media-info">
                    <span className="media-badge">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p className="media-date">
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
