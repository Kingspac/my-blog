import { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState(null);
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [fileError, setFileError] = useState("");

  const { id } = useParams(); // user ID from URL
  const { userInfo } = useContext(UserContext);

  // Is the logged in user viewing their OWN profile?
  const isOwnProfile = userInfo?.id === id;

  useEffect(() => {
    fetch(`http://localhost:4000/api/profile/${id}`)
      .then(response => response.json())
      .then(data => {
        setProfileData(data);
        setBio(data.user.bio || "");
        setProfilePhoto(data.user.profilePhoto || "");
      });
  }, [id]);

  // FILE VALIDATION
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
      setProfileData(prev => ({ ...prev, user: updatedUser }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } else {
      alert("Failed to update profile");
    }
  }

  if (!profileData) return "";

  const { user, posts } = profileData;

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
            <div className="profile-photo-placeholder">
              👤
            </div>
          )}
        </div>

        {/* Username */}
        <h2>{user.username}</h2>

        {/* Bio */}
        <p className="profile-bio">
          {user.bio || "No bio yet."}
        </p>

        {/* Edit button — only show on own profile */}
        {isOwnProfile && !isEditing && (
          <button
            className="edit-profile-btn"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* EDIT PROFILE FORM — only shows when editing */}
      {isOwnProfile && isEditing && (
        <form className="edit-profile-form" onSubmit={handleUpdateProfile}>
          <h3>Edit Profile</h3>

          <label>Profile Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {fileError && <p style={{color:"red", fontSize:"0.85rem"}}>{fileError}</p>}

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

      {/* USER'S POSTS */}
      <div className="profile-posts">
        <h3>{user.username}'s Posts ({posts.length})</h3>

        {posts.length === 0 ? (
          <p className="no-posts">No posts yet.</p>
        ) : (
          posts.map(post => (
            <div className="post" key={post._id}>
              <div>
                <img
                  src={`http://localhost:4000/${post.cover}`}
                  alt="post cover"
                />
              </div>
              <div className="text">
                <Link to={`/post/${post._id}`}>
                  <h2>{post.title}</h2>
                </Link>
                <p className="info">
                  <time>{formatISO9075(new Date(post.createdAt))}</time>
                </p>
                <p className="summary">{post.summary}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}