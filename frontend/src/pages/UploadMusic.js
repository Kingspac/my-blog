import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UploadMusic() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [category, setCategory] = useState("music");
  const [uploadType, setUploadType] = useState("youtube"); // "youtube" or "file"
  const [fileError, setFileError] = useState("");

  const navigate = useNavigate();

  function handleAudioChange(e) {
    const file = e.target.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setFileError("File too large! Max 50MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setAudioFile(e.target.files);
  }

  function handleCoverChange(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError("Cover photo too large! Max 5MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setCoverPhoto(e.target.files);
  }

  async function handleUpload(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("description", description);
    formData.append("category", category);

    if (uploadType === "youtube") {
      formData.append("youtubeLink", youtubeLink);
    } else {
      if (audioFile) formData.append("audioFile", audioFile[0]);
    }

    if (coverPhoto) formData.append("coverPhoto", coverPhoto[0]);

    const response = await fetch("http://localhost:4000/api/music/upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (response.ok) {
      navigate("/music");
    } else {
      alert("Upload failed. Please try again.");
    }
  }

  return (
    <div className="upload-music-page">
      <h1>🎵 Upload Music or Video</h1>

      <form onSubmit={handleUpload} className="upload-form">
        <label>Title *</label>
        <input
          type="text"
          placeholder="Song or video title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Artist Name *</label>
        <input
          type="text"
          placeholder="Artist or creator name"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
        />

        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="music">🎵 Music</option>
          <option value="comedy">😂 Comedy</option>
          <option value="culture">🏺 Culture</option>
          <option value="video">🎬 Video</option>
        </select>

        <label>Description</label>
        <textarea
          placeholder="Tell us about this song or video..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Upload Type Toggle */}
        <label>Upload Type</label>
        <div className="upload-type-toggle">
          <button
            type="button"
            className={uploadType === "youtube" ? "active" : ""}
            onClick={() => setUploadType("youtube")}
          >
            📺 YouTube Link
          </button>
          <button
            type="button"
            className={uploadType === "file" ? "active" : ""}
            onClick={() => setUploadType("file")}
          >
            📁 Upload File
          </button>
        </div>

        {/* YouTube Link Input */}
        {uploadType === "youtube" && (
          <>
            <label>YouTube Link</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
            />
          </>
        )}

        {/* File Upload Input */}
        {uploadType === "file" && (
          <>
            <label>Audio/Video File (Max 50MB)</label>
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleAudioChange}
            />
          </>
        )}

        {fileError && (
          <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
        )}

        <label>Cover Photo (Max 5MB)</label>
        <input type="file" accept="image/*" onChange={handleCoverChange} />

        <button type="submit" style={{ marginTop: "15px" }}>
          Upload 🎵
        </button>
      </form>
    </div>
  );
}
