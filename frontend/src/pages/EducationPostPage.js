import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  } catch (e) { return ""; }
}

const CATEGORY_ICONS = {
  history:  { icon: "🏛️", label: "History & Culture",  color: "#6B3410" },
  language: { icon: "🗣️", label: "Language Lessons",   color: "#5C4033" },
  health:   { icon: "❤️", label: "Health & Wellness",  color: "#8B2020" },
  career:   { icon: "💼", label: "Career & Skills",    color: "#2d4a22" },
};

export default function EducationPostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${apiUrl}/api/education/${id}`)
      .then(res => res.json())
      .then(data => {
        setPostInfo(data);
        setLikes(data.likes?.length || 0);
        if (userInfo?.id) setLiked(data.likes?.includes(userInfo.id));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handleLike() {
    if (!userInfo?.id) { alert("Please login to like"); return; }
    const res = await fetch(`${apiUrl}/api/education/${id}/like`, {
      method: "PUT", credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    const res = await fetch(`${apiUrl}/api/education/${id}`, {
      method: "DELETE", credentials: "include",
    });
    if (res.ok) navigate("/education");
    else alert("Failed to delete");
  }

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 20px", fontFamily: "'DM Sans', sans-serif", color: "#8B4513" }}>
      ⏳ Loading...
    </div>
  );

  if (!postInfo || postInfo === "not found") return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#aaa" }}>Content not found.</p>
      <Link to="/education" style={{ color: "#CD853F" }}>← Back to Education</Link>
    </div>
  );

  const catInfo = CATEGORY_ICONS[postInfo.category] || { icon: "📚", label: postInfo.category, color: "#8B4513" };
  const isAuthor = userInfo?.id === postInfo.author?._id;
  const hasVideo = postInfo.youtubeLink;

  return (
    <motion.div
      className="edu-post-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <style>{`
        .edu-post-page {
          max-width: 780px;
          margin: 0 auto;
          padding-bottom: 80px;
          background: white;
          min-height: 100vh;
        }

        /* COVER / VIDEO */
        .edu-post-cover {
          width: 100%;
          height: 260px;
          overflow: hidden;
          background: #1a1209;
        }
        .edu-post-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .edu-post-video {
          width: 100%;
          background: #000;
        }
        .edu-post-video iframe {
          width: 100%;
          height: 240px;
          display: block;
          border: none;
        }
        .edu-post-placeholder {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #1a1209, #3d2410);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        /* HEADER */
        .edu-post-header {
          padding: 18px 16px 0;
        }
        .edu-post-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .edu-post-badge-cat {
          background: #f0e8de;
          color: #8B4513;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          font-family: 'DM Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(139,69,19,0.15);
        }
        .edu-post-badge-lang {
          background: #2d2420;
          color: #CD853F;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
        }
        .edu-post-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.6rem;
          line-height: 1.3;
          color: #2d2420;
          margin-bottom: 12px;
          word-break: break-word;
        }
        .edu-post-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0e8de;
        }
        .edu-post-author {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          color: #8B4513;
        }
        .edu-post-author a {
          color: #CD853F;
          font-weight: 600;
          text-decoration: none;
        }
        .edu-post-date {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          color: #aaa;
        }

        /* EDIT ROW */
        .edu-edit-row {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        .edu-edit-btn {
          background: #2d2420;
          color: #DAA520;
          padding: 7px 16px;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          transition: opacity 0.2s;
        }
        .edu-edit-btn:hover { opacity: 0.85; }
        .edu-delete-btn {
          background: none;
          color: #cc0000;
          border: 1px solid #cc0000;
          padding: 7px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.82rem;
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          width: auto;
          transition: all 0.2s;
        }
        .edu-delete-btn:hover {
          background: #cc0000;
          color: white;
        }

        /* CONTENT */
        .edu-post-content {
          padding: 16px 16px 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 1rem;
          line-height: 1.85;
          color: #2d2420;
          overflow-x: hidden;
          word-break: break-word;
        }
        .edu-post-content img {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px;
          margin: 14px 0 !important;
          display: block !important;
        }
        .edu-post-content p { margin-bottom: 14px; }
        .edu-post-content h1,
        .edu-post-content h2,
        .edu-post-content h3 {
          font-family: 'Playfair Display', Georgia, serif;
          color: #2d2420;
          margin: 20px 0 10px;
        }
        .edu-post-content a { color: #CD853F; }
        .edu-post-content ul,
        .edu-post-content ol {
          padding-left: 20px;
          margin-bottom: 14px;
        }
        .edu-post-content li { margin-bottom: 6px; }
        .edu-post-content blockquote {
          border-left: 4px solid #CD853F;
          padding-left: 14px;
          color: #6b5a4e;
          font-style: italic;
          margin: 14px 0;
        }
        .edu-post-content pre,
        .edu-post-content code {
          background: #f4f0eb;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.9rem;
          overflow-x: auto;
          white-space: pre-wrap;
        }

        /* LIKE */
        .edu-like-section {
          padding: 16px;
          border-top: 1px solid #f0e8de;
          margin-top: 16px;
        }
        .edu-like-btn {
          background: none;
          border: 2px solid rgba(205,133,63,0.3);
          border-radius: 25px;
          padding: 8px 24px;
          cursor: pointer;
          font-size: 1rem;
          width: auto;
          color: #8B4513;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
        }
        .edu-like-btn:hover {
          border-color: #CD853F;
          background: rgba(205,133,63,0.08);
        }
        .edu-liked {
          border-color: #e0245e !important;
          color: #e0245e !important;
        }

        /* BOTTOM NAV */
        .edu-post-bottom {
          padding: 16px;
          border-top: 1px solid #f0e8de;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .edu-back-link {
          color: #CD853F;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: none;
        }
        .edu-back-link:hover { color: #8B4513; }

        /* PENDING BANNER */
        .edu-pending-banner {
          background: linear-gradient(135deg, #8B4513, #CD853F);
          color: white;
          padding: 10px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          text-align: center;
        }
      `}</style>

      {/* Pending banner for author */}
      {postInfo.status === "pending" && isAuthor && (
        <div className="edu-pending-banner">
          ⏳ This post is pending admin approval and is only visible to you
        </div>
      )}

      {/* VIDEO */}
      {hasVideo && (
        <div className="edu-post-video">
          <iframe
            src={`https://www.youtube.com/embed/${getYoutubeId(postInfo.youtubeLink)}`}
            title={postInfo.title}
            allowFullScreen
          />
        </div>
      )}

      {/* COVER IMAGE */}
      {postInfo.cover && !hasVideo && (
        <div className="edu-post-cover">
          <img src={`${apiUrl}/${postInfo.cover}`} alt={postInfo.title} />
        </div>
      )}

      {/* PLACEHOLDER */}
      {!postInfo.cover && !hasVideo && (
        <div className="edu-post-placeholder">{catInfo.icon}</div>
      )}

      {/* HEADER */}
      <div className="edu-post-header">
        <div className="edu-post-badges">
          <span className="edu-post-badge-cat">
            {catInfo.icon} {catInfo.label}
          </span>
          {postInfo.language && (
            <span className="edu-post-badge-lang">
              🌐 {postInfo.language}
            </span>
          )}
          {hasVideo && (
            <span className="edu-post-badge-lang">▶️ Video Lesson</span>
          )}
        </div>

        <h1 className="edu-post-title">{postInfo.title}</h1>

        <div className="edu-post-meta">
          <span className="edu-post-author">
            ✍️ By{" "}
            <Link to={`/profile/${postInfo.author?._id}`}>
              {postInfo.author?.username}
            </Link>
          </span>
          {postInfo.createdAt && (
            <span className="edu-post-date">📅 {safeDate(postInfo.createdAt)}</span>
          )}
          <span className="edu-post-date">❤️ {likes} {likes === 1 ? "Like" : "Likes"}</span>
        </div>

        {/* Edit / Delete for author */}
        {isAuthor && (
          <div className="edu-edit-row">
            <Link className="edu-edit-btn" to={`/education/edit/${postInfo._id}`}>
              ✏️ Edit
            </Link>
            <button className="edu-delete-btn" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div
        className="edu-post-content"
        dangerouslySetInnerHTML={{ __html: postInfo.content }}
      />

      {/* LIKE */}
      <div className="edu-like-section">
        <motion.button
          className={`edu-like-btn ${liked ? "edu-liked" : ""}`}
          onClick={handleLike}
          whileTap={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {liked ? "❤️" : "🤍"} {likes} {likes === 1 ? "Like" : "Likes"}
        </motion.button>
      </div>

      {/* BOTTOM */}
      <div className="edu-post-bottom">
        <Link to="/education" className="edu-back-link">
          ← Back to Education
        </Link>
        {!userInfo?.id && (
          <Link to="/register" style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            color: "#CD853F",
            fontWeight: 600,
            textDecoration: "none"
          }}>
            Join to like & comment →
          </Link>
        )}
      </div>
    </motion.div>
  );
}
