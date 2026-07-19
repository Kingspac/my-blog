import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { motion } from "framer-motion";
import Spinner from "../Spinner";
import styles from "../styles/UploadMedia.module.css";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function UploadMedia() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [uploadType, setUploadType] = useState("file");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  if (!userInfo?.id) { navigate("/login"); return null; }

  // Music is always file upload
  // Video can be file OR YouTube link
  const canUseLink = category === "video";

  function handleMediaFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      setFileError("File too large! Max 150MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setMediaFile(e.target.files);
  }

  function handleCoverPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 150 * 1024 * 1024) {
      setFileError("Cover photo too large! Max 150MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setCoverPhoto(e.target.files);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (fileError) return;

    // Validate
    if (uploadType === "link" && !youtubeLink.trim()) {
      setFileError("Please enter a YouTube link.");
      return;
    }
    if (uploadType === "file" && !mediaFile?.[0]) {
      setFileError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append("title", title);
    data.append("artist", artist);
    data.append("description", description);
    data.append("category", category);

    if (uploadType === "link") {
      data.append("youtubeLink", youtubeLink);
    } else {
      if (mediaFile?.[0]) data.append("audioFile", mediaFile[0]);
    }

    if (coverPhoto?.[0]) data.append("coverPhoto", coverPhoto[0]);

    const res = await fetch(`${apiUrl}/api/music`, {
      method: "POST",
      credentials: "include",
      body: data,
    });

    setIsUploading(false);
    if (res.ok) navigate("/entertainment");
    else alert("Upload failed. Please try again.");
  }

  return (
    <div className={styles.uploadPage}>
      {isUploading && <Spinner overlay text="Uploading your media... please wait" />}

      {/* HERO */}
      <div className={styles.uploadHero}>
        <h1>📤 Upload Media</h1>
        <p>Share your music and videos with the Adara community</p>
      </div>

      <form className={styles.uploadForm} onSubmit={handleSubmit}>

        {/* CATEGORY */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Category</label>
          <div className={styles.categoryTabs}>
            <button type="button"
              className={`${styles.catTab} ${category === "music" ? styles.active : ""}`}
              onClick={() => { setCategory("music"); setUploadType("file"); }}>
              🎵 Music
            </button>
            <button type="button"
              className={`${styles.catTab} ${category === "video" ? styles.active : ""}`}
              onClick={() => setCategory("video")}>
              🎬 Video
            </button>
          </div>
          {/* Info text */}
          <p style={{ fontSize: "0.75rem", color: "#8B4513", fontFamily: "'DM Sans',sans-serif", marginTop: 6 }}>
            {category === "music"
              ? "🎵 Upload your music file — it will play directly in the app like Spotify!"
              : "🎬 Upload a video file or paste a YouTube link to embed it"}
          </p>
        </div>

        <hr className={styles.divider} />

        {/* TITLE */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Title *</label>
          <input className={styles.uploadInput} type="text"
            placeholder={category === "music" ? "Song title..." : "Video title..."}
            value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        {/* ARTIST */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Artist / Creator</label>
          <input className={styles.uploadInput} type="text"
            placeholder="Artist or creator name (optional)"
            value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>

        <hr className={styles.divider} />

        {/* UPLOAD TYPE - only show toggle for video */}
        {canUseLink && (
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>Upload Type</label>
            <div className={styles.typeToggle}>
              <button type="button"
                className={`${styles.typeBtn} ${uploadType === "file" ? styles.active : ""}`}
                onClick={() => setUploadType("file")}>
                📁 Upload File
              </button>
              <button type="button"
                className={`${styles.typeBtn} ${uploadType === "link" ? styles.active : ""}`}
                onClick={() => setUploadType("link")}>
                ▶️ YouTube Link
              </button>
            </div>
          </div>
        )}

        {/* FILE UPLOAD */}
        {(uploadType === "file" || !canUseLink) && (
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>
              {category === "music" ? "🎵 Audio File (mp3, wav, m4a...)" : "🎬 Video File (mp4, mov...)"}
            </label>
            <input className={styles.uploadInput} type="file"
              accept={category === "music" ? "audio/*" : "video/*,audio/*"}
              onChange={handleMediaFile} />
          </div>
        )}

        {/* YOUTUBE LINK (video only) */}
        {canUseLink && uploadType === "link" && (
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>▶️ YouTube Link</label>
            <input className={styles.uploadInput} type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              required />
            <p style={{ fontSize: "0.72rem", color: "#aaa", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
              Only YouTube links can be embedded. The video will play directly in the app.
            </p>
          </div>
        )}

        <hr className={styles.divider} />

        {/* COVER PHOTO */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>
            {category === "music" ? "🖼️ Cover Art (optional)" : "🖼️ Cover Photo (optional)"}
          </label>
          {coverPreview && (
            <div className={styles.coverPreviewBox}>
              <img src={coverPreview} alt="cover preview" />
            </div>
          )}
          <input className={styles.uploadInput} type="file"
            accept="image/*" onChange={handleCoverPhoto} />
        </div>

        {/* DESCRIPTION */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Description (optional)</label>
          <textarea className={styles.uploadInput}
            placeholder={category === "music" ? "Tell us about this song..." : "Tell us about this video..."}
            value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} />
        </div>

        {fileError && <p className={styles.errorText}>⚠️ {fileError}</p>}

        <motion.button type="submit" className={styles.submitBtn}
          disabled={isUploading} whileTap={{ scale: 0.97 }}>
          {isUploading ? <><Spinner inline />Uploading...</> : `📤 Upload ${category === "music" ? "Music" : "Video"}`}
        </motion.button>
      </form>
    </div>
  );
}
