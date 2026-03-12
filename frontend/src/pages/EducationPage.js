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

// Category labels and icons
const categories = [
  { key: null, label: "🏠 All" },
  { key: "history", label: "📜 History & Culture" },
  { key: "language", label: "🗣️ Language" },
  { key: "health", label: "🏥 Health & Wellbeing" },
  { key: "career", label: "🎓 Career & Education" },
];

// Language sub-tabs for language category
const languages = [
  { key: null, label: "All" },
  { key: "adara", label: "🪨 Adara" },
  { key: "hausa", label: "Hausa" },
  { key: "english", label: "🇬🇧 English" },
];

export default function EducationPage() {
  const [educationList, setEducationList] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [activeLanguage, setActiveLanguage] = useState(null);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch("http://localhost:4000/api/education")
      .then((res) => res.json())
      .then((data) => setEducationList(data));
  }, []);

  // Filter by category and language
  let filtered = activeTab
    ? educationList.filter((e) => e.category === activeTab)
    : educationList;

  // If language tab is active, filter further by language
  if (activeTab === "language" && activeLanguage) {
    filtered = filtered.filter((e) => e.language === activeLanguage);
  }

  return (
    <div className="education-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>📚 Education</h2>
        <p>Learn about Adara history, language, health and more</p>

        {/* Create button - only for logged in users */}
        {userInfo?.id && (
          <Link to="/education/create" className="create-btn">
            + Create
          </Link>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div className="education-tabs">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={activeTab === cat.key ? "active" : ""}
            onClick={() => {
              setActiveTab(cat.key);
              setActiveLanguage(null); // reset language filter
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* LANGUAGE SUB-TABS - only show when language tab is active */}
      {activeTab === "language" && (
        <div className="language-tabs">
          {languages.map((lang) => (
            <button
              key={lang.key}
              className={activeLanguage === lang.key ? "active" : ""}
              onClick={() => setActiveLanguage(lang.key)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* COMING SOON BANNER - Live Folklore Show */}
      <div className="folklore-banner">
        <p>🔴 Coming Soon: <strong>Live Folklore Show</strong> — Watch and learn Adara traditions live!</p>
      </div>

      {/* CONTENT */}
      {filtered.length === 0 ? (
        <p className="no-content">
          No content yet. Be the first to contribute!
        </p>
      ) : (
        <div className="education-grid">
          {filtered.map((item) => (
            <div className="education-card" key={item._id}>

              {/* Cover Image */}
              {item.cover && !item.youtubeLink && (
                <div className="education-cover">
                  <img
                    src={`http://localhost:4000/${item.cover}`}
                    alt={item.title}
                  />
                </div>
              )}

              {/* YouTube Embed */}
              {item.youtubeLink && (
                <div className="youtube-embed">
                  <iframe
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${getYoutubeId(item.youtubeLink)}`}
                    title={item.title}
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Content Info */}
              <div className="education-info">
                <div className="education-badges">
                  <span className="education-category">{item.category}</span>
                  {item.language && (
                    <span className="education-language">{item.language}</span>
                  )}
                </div>
                <Link to={`/education/${item._id}`}>
                  <h3>{item.title}</h3>
                </Link>
                {item.summary && (
                  <p className="education-summary">{item.summary}</p>
                )}
                <p className="education-author">
                  ✍️{" "}
                  <Link to={`/profile/${item.author?._id}`}>
                    {item.author?.username}
                  </Link>
                </p>
                <p className="education-date">
                  {formatISO9075(new Date(item.createdAt))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Encourage non-logged in users to register */}
      {!userInfo?.id && (
        <div className="register-prompt">
          <p>🪨 Want to contribute? Join the Adara community!</p>
          <div className="login-required-buttons">
            <Link to="/register" className="create-btn">Register</Link>
            <Link to="/login" className="create-btn entertainment">Login</Link>
          </div>
        </div>
      )}
    </div>
  );
}
