import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { UserContext } from "../UserContext";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

function getYoutubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function safeDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) { return ""; }
}

const CATEGORIES = [
  { key: null,      label: "🏠 All",       color: "#8B4513" },
  { key: "history", label: "🏛️ History",   color: "#6B3410" },
  { key: "language",label: "🗣️ Language",  color: "#5C4033" },
  { key: "health",  label: "❤️ Health",    color: "#8B2020" },
  { key: "career",  label: "💼 Career",    color: "#2d4a22" },
];

export default function EducationPage() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch(`${apiUrl}/api/education`)
      .then(r => r.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
        setLoaded(true);
      });
  }, []);

  const filtered = activeCategory
    ? posts.filter(p => p.category === activeCategory)
    : posts;

  return (
    <div className="edu-page">
      <style>{`
        .edu-page {
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 80px;
          background: #f0e8de;
          min-height: 100vh;
        }

        /* HERO */
        .edu-hero {
          background: linear-gradient(135deg, #1a1209, #3d2410);
          padding: 30px 20px 28px;
          text-align: center;
          border-bottom: 2px solid rgba(205,133,63,0.3);
          position: relative;
        }
        .edu-hero h1 {
          font-family: 'Playfair Display', Georgia, serif;
          color: #CD853F;
          font-size: 1.7rem;
          margin-bottom: 6px;
          text-shadow: 0 0 20px rgba(205,133,63,0.3);
        }
        .edu-hero p {
          color: #a07850;
          font-size: 0.85rem;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 16px;
        }
        .edu-create-btn {
          display: inline-block;
          background: linear-gradient(135deg, #8B4513, #CD853F);
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          text-decoration: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(139,69,19,0.4);
          transition: opacity 0.2s;
        }
        .edu-create-btn:hover { opacity: 0.9; }

        /* CATEGORY TABS */
        .edu-tabs {
          display: flex;
          gap: 8px;
          padding: 14px 14px 0;
          overflow-x: auto;
          scrollbar-width: none;
          background: white;
          border-bottom: 1px solid rgba(205,133,63,0.1);
          padding-bottom: 12px;
        }
        .edu-tabs::-webkit-scrollbar { display: none; }
        .edu-tab {
          flex-shrink: 0;
          padding: 7px 16px;
          border: 2px solid rgba(205,133,63,0.2);
          border-radius: 20px;
          background: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          color: #8B4513;
          transition: all 0.2s;
          width: auto;
          margin: 0;
        }
        .edu-tab-active {
          background: linear-gradient(135deg, #8B4513, #CD853F) !important;
          color: white !important;
          border-color: transparent !important;
          box-shadow: 0 3px 10px rgba(139,69,19,0.3);
        }

        /* GRID */
        .edu-grid {
          padding: 14px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        /* CARD */
        .edu-card {
          background: white;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(139,90,43,0.1);
          border: 1px solid rgba(205,133,63,0.08);
          cursor: pointer;
          text-decoration: none;
          display: block;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .edu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139,90,43,0.15);
        }

        .edu-card-thumb {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
          background: #1a1209;
        }

        .edu-card-thumb-youtube {
          width: 100%;
          height: 200px;
          display: block;
          background: #000;
        }

        .edu-card-thumb-placeholder {
          width: 100%;
          height: 120px;
          background: linear-gradient(135deg, #1a1209, #3d2410);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
        }

        .edu-card-body {
          padding: 12px 14px 14px;
        }

        .edu-card-badges {
          display: flex;
          gap: 6px;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }

        .edu-badge-cat {
          background: #f0e8de;
          color: #8B4513;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(139,69,19,0.15);
        }

        .edu-badge-lang {
          background: #2d2420;
          color: #CD853F;
          padding: 2px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }

        .edu-card-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1rem;
          color: #2d2420;
          font-weight: 700;
          margin-bottom: 6px;
          line-height: 1.35;
        }

        .edu-card-summary {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          color: #6b5a4e;
          line-height: 1.5;
          margin-bottom: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .edu-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .edu-card-author {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          color: #8B4513;
        }

        .edu-card-date {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.72rem;
          color: #aaa;
        }

        .edu-card-read {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          color: #CD853F;
          font-weight: 600;
        }

        .edu-empty {
          text-align: center;
          padding: 40px 20px;
          color: #aaa;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
        }
        .edu-empty span { display: block; font-size: 2.5rem; margin-bottom: 12px; }
      `}</style>

      {/* HERO */}
      <div className="edu-hero">
        <h1>📚 Education</h1>
        <p>Learn about Adara history, language, health & career</p>
        {userInfo?.id && (
          <Link to="/education/create" className="edu-create-btn">
            + Share Knowledge
          </Link>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div className="edu-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key ?? "all"}
            className={`edu-tab ${activeCategory === cat.key ? "edu-tab-active" : ""}`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* CONTENT GRID */}
      <div className="edu-grid">
        {!loaded && (
          <div className="edu-empty">
            <span>⏳</span>Loading...
          </div>
        )}

        {loaded && filtered.length === 0 && (
          <div className="edu-empty">
            <span>📭</span>
            No {activeCategory || ""} content yet.
            {userInfo?.id && " Be the first to share!"}
          </div>
        )}

        {loaded && filtered.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <Link to={`/education/${post._id}`} className="edu-card">

              {/* YouTube thumbnail */}
              {post.youtubeLink && (
                <img
                  className="edu-card-thumb"
                  src={`https://img.youtube.com/vi/${getYoutubeId(post.youtubeLink)}/hqdefault.jpg`}
                  alt={post.title}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}

              {/* Cover image */}
              {post.cover && !post.youtubeLink && (
                <img
                  className="edu-card-thumb"
                  src={`${apiUrl}/${post.cover}`}
                  alt={post.title}
                />
              )}

              {/* Placeholder */}
              {!post.cover && !post.youtubeLink && (
                <div className="edu-card-thumb-placeholder">
                  {post.category === "history" ? "🏛️"
                    : post.category === "language" ? "🗣️"
                    : post.category === "health" ? "❤️"
                    : "💼"}
                </div>
              )}

              {/* Card body */}
              <div className="edu-card-body">
                <div className="edu-card-badges">
                  <span className="edu-badge-cat">{post.category}</span>
                  {post.language && (
                    <span className="edu-badge-lang">{post.language}</span>
                  )}
                  {post.youtubeLink && (
                    <span className="edu-badge-lang">▶️ Video</span>
                  )}
                </div>

                <div className="edu-card-title">{post.title}</div>

                {post.summary && (
                  <div className="edu-card-summary">{post.summary}</div>
                )}

                <div className="edu-card-footer">
                  <span className="edu-card-author">
                    ✍️ {post.author?.username}
                  </span>
                  <span className="edu-card-date">{safeDate(post.createdAt)}</span>
                  <span className="edu-card-read">Read →</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Login prompt */}
      {!userInfo?.id && loaded && (
        <div style={{
          textAlign: "center", padding: "20px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.88rem", color: "#8B4513"
        }}>
          <Link to="/register" style={{ color: "#CD853F", fontWeight: 600 }}>Join Enchwra</Link>
          {" "}to share your knowledge with the community!
        </div>
      )}
    </div>
  );
}
