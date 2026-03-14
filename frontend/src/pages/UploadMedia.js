import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";

export default function UploadMedia() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploadType, setUploadType] = useState("file"); // "file" or "youtube"

  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  if (!userInfo?.id) {
    navigate("/login");
    return null;
  }

  function handleMediaFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setFileError("File too large! Max 50MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setMediaFile(e.target.files);
  }

  function handleCoverPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setFileError("Cover photo too large! Max 20MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setCoverPhoto(e.target.files);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (fileError) return;

    const data = new FormData();
    data.append("title", title);
    data.append("artist", artist);
    data.append("description", description);
    data.append("category", category);

    if (uploadType === "youtube") {
      data.append("youtubeLink", youtubeLink);
    } else {
      if (mediaFile?.[0]) data.append("audioFile", mediaFile[0]);
    }

    if (coverPhoto?.[0]) data.append("coverPhoto", coverPhoto[0]);

    const res = await fetch("http://localhost:4000/api/music", {
      method: "POST",
      credentials: "include",
      body: data,
    });

    if (res.ok) {
      navigate("/entertainment");
    } else {
      alert("Upload failed. Please try again.");
    }
  }

  return (
    <div className="create-education-page">
      <h1>📤 Upload Media</h1>

      <form onSubmit={handleSubmit}>

        {/* TITLE */}
        <label>Title *</label>
        <input
          type="text"
          placeholder="Title of your media"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* ARTIST */}
        <label>Artist / Creator Name</label>
        <input
          type="text"
          placeholder="Artist or creator name (optional)"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
        />

        {/* CATEGORY - only Music and Video now */}
        <label>Category *</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="music">🎵 Music</option>
          <option value="video">🎬 Video</option>
        </select>

        {/* UPLOAD TYPE */}
        <label>Upload Type *</label>
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <button
            type="button"
            onClick={() => setUploadType("file")}
            style={{
              width: "auto",
              background: uploadType === "file" ? "#333" : "#eee",
              color: uploadType === "file" ? "white" : "#333",
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            📁 Upload File
          </button>
          <button
            type="button"
            onClick={() => setUploadType("youtube")}
            style={{
              width: "auto",
              background: uploadType === "youtube" ? "#333" : "#eee",
              color: uploadType === "youtube" ? "white" : "#333",
              padding: "8px 16px",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
            }}
          >
            ▶️ YouTube Link
          </button>
        </div>

        {/* FILE UPLOAD */}
        {uploadType === "file" && (
          <>
            <label>Media File (mp3, mp4, etc.) *</label>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleMediaFile}
            />
          </>
        )}

        {/* YOUTUBE LINK */}
        {uploadType === "youtube" && (
          <>
            <label>YouTube Link *</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />
          </>
        )}

        {/* COVER PHOTO */}
        <label>Cover Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverPhoto}
        />

        {/* DESCRIPTION */}
        <label>Description (optional)</label>
        <textarea
          placeholder="Tell us about this media..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* ERROR */}
        {fileError && (
          <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
        )}

        <button type="submit" style={{ marginTop: "15px" }}>
          📤 Upload Media
        </button>
      </form>
    </div>
  );
}
