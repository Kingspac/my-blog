import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";
import styles from "../styles/EducationPage.module.css";

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

  // Filter by category
  let filtered = activeTab
    ? educationList.filter((e) => e.category === activeTab)
    : educationList;

  // Filter further by language if language tab is active
  if (activeTab === "language" && activeLanguage) {
    filtered = filtered.filter((e) => e.language === activeLanguage);
  }

  return (
    <div className={styles.educationPage}>

      {/* PAGE HEADER - global.css */}
      <div className="page-header">
        <h2>📚 Education</h2>
        <p>Learn about Adara history, language, health and more</p>

        {userInfo?.id && (
          <Link to="/education/create" className="create-btn">
            + Create
          </Link>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div className={styles.educationTabs}>
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={activeTab === cat.key ? styles.active : ""}
            onClick={() => {
              setActiveTab(cat.key);
              setActiveLanguage(null);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* LANGUAGE SUB-TABS */}
      {activeTab === "language" && (
        <div className={styles.languageTabs}>
          {languages.map((lang) => (
            <button
              key={lang.key}
              className={activeLanguage === lang.key ? styles.active : ""}
              onClick={() => setActiveLanguage(lang.key)}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* COMING SOON BANNER */}
      <div className={styles.folkloreBanner}>
        <p>🔴 Coming Soon: <strong>Live Folklore Show</strong> — Watch and learn Adara traditions live!</p>
      </div>

      {/* CONTENT */}
      {filtered.length === 0 ? (
        <p className="no-content">
          No content yet. Be the first to contribute!
        </p>
      ) : (
        <div className={styles.educationGrid}>
          {filtered.map((item) => (
            <div className={styles.educationCard} key={item._id}>

              {/* Cover Image */}
              {item.cover && !item.youtubeLink && (
                <div className={styles.educationCover}>
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
              <div className={styles.educationInfo}>
                <div className={styles.educationBadges}>
                  <span className={styles.educationCategory}>{item.category}</span>
                  {item.language && (
                    <span className={styles.educationLanguage}>{item.language}</span>
                  )}
                </div>
                <Link to={`/education/${item._id}`}>
                  <h3>{item.title}</h3>
                </Link>
                {item.summary && (
                  <p className={styles.educationSummary}>{item.summary}</p>
                )}
                <p className={styles.educationAuthor}>
                  ✍️{" "}
                  <Link to={`/profile/${item.author?._id}`}>
                    {item.author?.username}
                  </Link>
                </p>
                <p className={styles.educationDate}>
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
