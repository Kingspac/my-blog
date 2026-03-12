import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";

// Helper to extract YouTube video ID from URL
function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function MusicPage() {
  const [musicList, setMusicList] = useState([]);
  const [filter, setFilter] = useState("all");
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch("http://localhost:4000/api/music")
      .then((res) => res.json())
      .then((data) => setMusicList(data));
  }, []);

  // Filter by category
  const filtered =
    filter === "all"
      ? musicList
      : musicList.filter((m) => m.category === filter);

  return (
    <div className="music-page">
      <div className="music-header">
        <h1>🎵 Adara Music & Culture</h1>
        <p>Discover and share the sounds of the Adara people</p>

        {/* Upload button - only for logged in users */}
        {userInfo?.id && (
          <Link to="/music/upload" className="upload-btn">
            + Upload Music
          </Link>
        )}
      </div>

      {/* Category Filter Buttons */}
      <div className="music-filters">
        <button
          className={filter === "all" ? "active" : ""}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={filter === "music" ? "active" : ""}
          onClick={() => setFilter("music")}
        >
          🎵 Music
        </button>
        <button
          className={filter === "comedy" ? "active" : ""}
          onClick={() => setFilter("comedy")}
        >
          😂 Comedy
        </button>
        <button
          className={filter === "culture" ? "active" : ""}
          onClick={() => setFilter("culture")}
        >
          🏺 Culture
        </button>
        <button
          className={filter === "video" ? "active" : ""}
          onClick={() => setFilter("video")}
        >
          🎬 Video
        </button>
      </div>

      {/* Music Grid */}
      {filtered.length === 0 ? (
        <p className="no-music">No content yet. Be the first to upload!</p>
      ) : (
        <div className="music-grid">
          {filtered.map((music) => (
            <div className="music-card" key={music._id}>
              {/* Cover Photo */}
              {music.coverPhoto && (
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
                    <source
                      src={`http://localhost:4000/${music.audioFile}`}
                    />
                    Your browser does not support audio.
                  </audio>
                </div>
              )}

              {/* Music Info */}
              <div className="music-info">
                <h3>{music.title}</h3>
                <p className="music-artist">
                  🎤{" "}
                  <Link to={`/profile/${music.uploadedBy._id}`}>
                    {music.uploadedBy.username}
                  </Link>
                </p>
                {music.description && (
                  <p className="music-description">{music.description}</p>
                )}
                <p className="music-date">
                  {formatISO9075(new Date(music.createdAt))}
                </p>
                <span className="music-category">{music.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
