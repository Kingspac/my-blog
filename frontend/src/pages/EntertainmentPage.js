 import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";

// Helper to extract YouTube video ID
function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// Reusable media card component
function MediaCard({ music }) {
  return (
    <div className="music-card">
      {/* Cover Photo */}
      {music.coverPhoto && !music.youtubeLink && (
        <div className="music-cover">
          <img
            src={`http://localhost:4000/${music.coverPhoto}`}
            alt={music.title}
          />
        </div>
      )}

      {/* YouTube Embed */}
      {music.youtubeLink && (
        <div className="youtube-embed">
          <iframe
            width="100%"
            height="200"
            src={`https://www.youtube.com/embed/${getYoutubeId(music.youtubeLink)}`}
            title={music.title}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      )}

      {/* Audio Player */}
      {music.audioFile && !music.youtubeLink && (
        <div className="audio-player">
          <audio controls style={{ width: "100%" }}>
            <source src={`http://localhost:4000/${music.audioFile}`} />
            Your browser does not support audio.
          </audio>
        </div>
      )}

      {/* Info */}
      <div className="music-info">
        <span className="music-category">{music.category}</span>
        <h3>{music.title}</h3>
        <p className="music-artist">
          🎤{" "}
          <Link to={`/profile/${music.uploadedBy?._id}`}>
            {music.artist || music.uploadedBy?.username}
          </Link>
        </p>
        {music.description && (
          <p className="music-description">{music.description}</p>
        )}
        <p className="music-date">
          {formatISO9075(new Date(music.createdAt))}
        </p>
      </div>
    </div>
  );
}

export default function EntertainmentPage() {
  const [musicList, setMusicList] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // null = all/mixed
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch("http://localhost:4000/api/music")
      .then((res) => res.json())
      .then((data) => setMusicList(data));
  }, []);

  // Filter by active tab - no tab = show everything
  const filtered = activeTab
    ? musicList.filter((m) => m.category === activeTab)
    : musicList;

  return (
    <div className="entertainment-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>🎬 Entertainment</h2>
        <p>Music, videos, comedy and culture of the Adara people</p>

        {/* Upload button - only for logged in users */}
        {userInfo?.id && (
          <Link to="/entertainment/upload" className="create-btn">
            + Upload
          </Link>
        )}
      </div>

      {/* TABS - visible to everyone */}
      <div className="entertainment-tabs">
        <button
          className={activeTab === null ? "active" : ""}
          onClick={() => setActiveTab(null)}
        >
          🏠 All
        </button>
        <button
          className={activeTab === "music" ? "active" : ""}
          onClick={() => setActiveTab("music")}
        >
          🎵 Music
        </button>
        <button
          className={activeTab === "video" ? "active" : ""}
          onClick={() => setActiveTab("video")}
        >
          🎬 Video
        </button>
        <button
          className={activeTab === "comedy" ? "active" : ""}
          onClick={() => setActiveTab("comedy")}
        >
          😂 Comedy
        </button>
        <button
          className={activeTab === "culture" ? "active" : ""}
          onClick={() => setActiveTab("culture")}
        >
          🏺 Culture
        </button>
      </div>

      {/* CONTENT - visible to everyone, no login required */}
      {filtered.length === 0 ? (
        <p className="no-content">
          {activeTab
            ? `No ${activeTab} content yet. Be the first to upload!`
            : "No content yet. Be the first to upload!"}
        </p>
      ) : (
        <div className="music-grid">
          {filtered.map((music) => (
            <MediaCard key={music._id} music={music} />
          ))}
        </div>
      )}

      {/* Encourage non-logged in users to register */}
      {!userInfo?.id && (
        <div className="register-prompt">
          <p>🪨 Enjoy the content? Join the Adara community!</p>
          <div className="login-required-buttons">
            <Link to="/register" className="create-btn">Register</Link>
            <Link to="/login" className="create-btn entertainment">Login</Link>
          </div>
        </div>
      )}

    </div>
  );
}
