import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import { motion } from "framer-motion";
import styles from "../styles/UploadMedia.module.css";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

const videoPlatforms = [
  { value: "youtube", label: "▶️ YouTube" },
  { value: "facebook", label: "📘 Facebook" },
  { value: "tiktok", label: "🎵 TikTok" },
  { value: "instagram", label: "📸 Instagram" },
  { value: "other", label: "🔗 Other" },
];

const musicPlatforms = [
  { value: "spotify", label: "🎵 Spotify" },
  { value: "youtube_music", label: "▶️ YouTube Music" },
  { value: "apple_music", label: "🍎 Apple Music" },
  { value: "audiomack", label: "🎧 Audiomack" },
  { value: "other", label: "🔗 Other" },
];

export default function UploadMedia() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("music");
  const [uploadType, setUploadType] = useState("file");
  const [platform, setPlatform] = useState("spotify");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const navigate = useNavigate();
  const { userInfo } = useContext(UserContext);

  if (!userInfo?.id) { navigate("/login"); return null; }

  const platforms = category === "music" ? musicPlatforms : videoPlatforms;

  function handleMediaFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
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
    if (file.size > 20 * 1024 * 1024) {
      setFileError("Cover photo too large! Max 20MB.");
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
    setIsUploading(true);

    const data = new FormData();
    data.append("title", title);
    data.append("artist", artist);
    data.append("description", description);
    data.append("category", category);

    if (uploadType === "link") {
      data.append("youtubeLink", linkUrl);
      data.append("platform", platform);
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
    if (res.ok) {
      navigate("/entertainment");
    } else {
      alert("Upload failed. Please try again.");
    }
  }

  return (
    <div className={styles.uploadPage}>

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
            <button
              type="button"
              className={`${styles.catTab} ${category === "music" ? styles.active : ""}`}
              onClick={() => { setCategory("music"); setPlatform("spotify"); }}
            >🎵 Music</button>
            <button
              type="button"
              className={`${styles.catTab} ${category === "video" ? styles.active : ""}`}
              onClick={() => { setCategory("video"); setPlatform("youtube"); }}
            >🎬 Video</button>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* TITLE */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Title *</label>
          <input
            className={styles.uploadInput}
            type="text"
            placeholder={category === "music" ? "Song title..." : "Video title..."}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* ARTIST */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Artist / Creator</label>
          <input
            className={styles.uploadInput}
            type="text"
            placeholder="Artist or creator name (optional)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>

        <hr className={styles.divider} />

        {/* UPLOAD TYPE */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Upload Type</label>
          <div className={styles.typeToggle}>
            <button
              type="button"
              className={`${styles.typeBtn} ${uploadType === "file" ? styles.active : ""}`}
              onClick={() => setUploadType("file")}
            >📁 Upload File</button>
            <button
              type="button"
              className={`${styles.typeBtn} ${uploadType === "link" ? styles.active : ""}`}
              onClick={() => setUploadType("link")}
            >🔗 Paste Link</button>
          </div>
        </div>

        {/* FILE */}
        {uploadType === "file" && (
          <div className={styles.uploadField}>
            <label className={styles.uploadLabel}>
              {category === "music" ? "Audio File (mp3, wav...)" : "Video File (mp4, mov...)"}
            </label>
            <input
              className={styles.uploadInput}
              type="file"
              accept={category === "music" ? "audio/*" : "video/*,audio/*"}
              onChange={handleMediaFile}
            />
          </div>
        )}

        {/* LINK */}
        {uploadType === "link" && (
          <>
            <div className={styles.uploadField}>
              <label className={styles.uploadLabel}>Platform</label>
              <div className={styles.platformGrid}>
                {platforms.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={`${styles.platformPill} ${platform === p.value ? styles.active : ""}`}
                    onClick={() => setPlatform(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.uploadField}>
              <label className={styles.uploadLabel}>
                {platforms.find(p => p.value === platform)?.label} Link
              </label>
              <input
                className={styles.uploadInput}
                type="url"
                placeholder={
                  platform === "spotify" ? "https://open.spotify.com/track/..." :
                  platform === "youtube" || platform === "youtube_music" ? "https://www.youtube.com/watch?v=..." :
                  platform === "tiktok" ? "https://www.tiktok.com/@user/video/..." :
                  platform === "facebook" ? "https://www.facebook.com/watch/?v=..." :
                  "Paste your link here..."
                }
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <hr className={styles.divider} />

        {/* COVER PHOTO */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Cover Photo (optional)</label>
          {coverPreview && (
            <div className={styles.coverPreviewBox}>
              <img src={coverPreview} alt="cover preview" />
            </div>
          )}
          <input
            className={styles.uploadInput}
            type="file"
            accept="image/*"
            onChange={handleCoverPhoto}
          />
        </div>

        {/* DESCRIPTION */}
        <div className={styles.uploadField}>
          <label className={styles.uploadLabel}>Description (optional)</label>
          <textarea
            className={styles.uploadInput}
            placeholder={category === "music" ? "Tell us about this song..." : "Tell us about this video..."}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {fileError && <p className={styles.errorText}>⚠️ {fileError}</p>}

        <motion.button
          type="submit"
          className={styles.submitBtn}
          disabled={isUploading}
          whileTap={{ scale: 0.97 }}
        >
          {isUploading ? "⏳ Uploading..." : "📤 Upload Media"}
        </motion.button>
      </form>
    </div>
  );
}
