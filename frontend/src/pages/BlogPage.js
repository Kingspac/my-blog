import Post from "../Post.js";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatISO9075 } from "date-fns";

// Helper to extract YouTube video ID
function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [music, setMusic] = useState([]);

  useEffect(() => {
    // Fetch blog posts
    fetch("http://localhost:4000/api/post")
      .then((res) => res.json())
      .then((data) => setPosts(data));

    // Fetch entertainment content
    fetch("http://localhost:4000/api/music")
      .then((res) => res.json())
      .then((data) => setMusic(data));
  }, []);

  // Mix posts and music together and sort by date (newest first)
  const mixedFeed = [
    ...posts.map((p) => ({ ...p, itemType: "post" })),
    ...music.map((m) => ({ ...m, itemType: "media" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="index-page">
      <div className="feed-header">
        <h2>Welcome to Enchwra 🪨</h2>
        <p>Voice, Culture & Entertainment of the Adara People</p>
      </div>

      {mixedFeed.length === 0 && (
        <p className="no-content">No content yet. Be the first to post!</p>
      )}

      {mixedFeed.map((item) => (
        <div key={item._id}>
          {/* Render blog post */}
          {item.itemType === "post" && <Post {...item} />}

          {/* Render entertainment/media card */}
          {item.itemType === "media" && (
            <div className="media-card">
              {/* Cover Photo */}
              {item.coverPhoto && !item.youtubeLink && (
                <div className="media-cover">
                  <img
                    src={`http://localhost:4000/${item.coverPhoto}`}
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

              {/* Audio Player */}
              {item.audioFile && !item.youtubeLink && (
                <div className="audio-player">
                  <audio controls style={{ width: "100%" }}>
                    <source src={`http://localhost:4000/${item.audioFile}`} />
                    Your browser does not support audio.
                  </audio>
                </div>
              )}

              {/* Media Info */}
              <div className="media-info">
                <span className="media-badge">{item.category}</span>
                <h3>{item.title}</h3>
                <p className="media-artist">
                  🎤{" "}
                  <Link to={`/profile/${item.uploadedBy?._id}`}>
                    {item.uploadedBy?.username}
                  </Link>
                </p>
                {item.description && (
                  <p className="media-description">{item.description}</p>
                )}
                <p className="media-date">
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
