import Post from "../Post.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import styles from "../styles/IndexPage.module.css";

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

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [music, setMusic] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post`)
      .then((res) => res.json())
      .then((data) => setPosts(data));

    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/music`)
      .then((res) => res.json())
      .then((data) => setMusic(data));
  }, []);

  const mixedFeed = [
    ...posts.map((p) => ({ ...p, itemType: "post" })),
    ...music.map((m) => ({ ...m, itemType: "media" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div>

      {/* FEED HEADER */}
      <div className={styles.feedHeader}>
        <h2>Welcome to Enchwra 🪨</h2>
        <p>Voice, Culture & Entertainment of the Adara People</p>
      </div>

      {/* ROOM BANNER */}
      <Link to="/room" className={styles.roomBanner}>
        🪨 Join the Enchwra Community Room — Come talk with your people!
      </Link>

      {/* MIXED FEED */}
      {mixedFeed.length === 0 && (
        <p className="no-content">No content yet. Be the first to post!</p>
      )}

      {mixedFeed.map((item) => (
        <div key={item._id}>

          {/* Blog Post */}
          {item.itemType === "post" && <Post {...item} />}

          {/* Media Card */}
          {item.itemType === "media" && (
            <div className={styles.mediaCard}>

              {/* Cover Photo - only for audio (not video files) */}
              {item.coverPhoto && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                <div className={styles.mediaCover}>
                  <img
                    src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${item.coverPhoto}`}
                    alt={item.title}
                  />
                </div>
              )}

              {/* YouTube Embed */}
              {item.youtubeLink && (
                <div className="youtube-embed">
                  <iframe
                    width="100%"
                    height="220"
                    src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                    title={item.title}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              )}

              {/* VIDEO player - mp4 and other video files */}
              {item.audioFile && !item.youtubeLink && isVideoFile(item.audioFile) && (
                <video controls style={{ width: "100%", display: "block", background: "#000" }}>
                  <source src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${item.audioFile}`} type="video/mp4" />
                  Your browser does not support video.
                </video>
              )}

              {/* AUDIO player - mp3 and other audio files only */}
              {item.audioFile && !item.youtubeLink && !isVideoFile(item.audioFile) && (
                <div style={{ padding: "10px", background: "#f9f9f9" }}>
                  <audio controls style={{ width: "100%" }}>
                    <source src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${item.audioFile}`} />
                    Your browser does not support audio.
                  </audio>
                </div>
              )}

              {/* Media Info */}
              <div className={styles.mediaInfo}>
                <span className={styles.mediaBadge}>{item.category}</span>
                <h3>{item.title}</h3>
                <p className={styles.mediaArtist}>
                  🎤{" "}
                  <Link to={`/profile/${item.uploadedBy?._id}`}>
                    {item.artist || item.uploadedBy?.username}
                  </Link>
                </p>
                {item.description && (
                  <p className={styles.mediaDescription}>{item.description}</p>
                )}
                <p className={styles.mediaDate}>
                  {formatISO9075(new Date(item.createdAt))}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
