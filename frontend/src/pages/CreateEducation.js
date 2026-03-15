import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "../Editor";

export default function CreateEducation() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("history");
  const [language, setLanguage] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [cover, setCover] = useState(null);
  const [fileError, setFileError] = useState("");

  const navigate = useNavigate();

  function handleCoverChange(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setFileError("Image too large! Max 5MB.");
      e.target.value = "";
      return;
    }
    setFileError("");
    setCover(e.target.files);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("summary", summary);
    formData.append("content", content);
    formData.append("category", category);
    if (language) formData.append("language", language);
    if (youtubeLink) formData.append("youtubeLink", youtubeLink);
    if (cover) formData.append("cover", cover[0]);

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/education/create`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (response.ok) {
      navigate("/education");
    } else {
      alert("Failed to create content. Please try again.");
    }
  }

  return (
    <div className="create-education-page">
      <h1>📚 Create Educational Content</h1>

      <form onSubmit={handleSubmit}>

        <label>Title *</label>
        <input
          type="text"
          placeholder="Title of your content"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Summary</label>
        <input
          type="text"
          placeholder="Brief description of your content"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        <label>Category *</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setLanguage(""); // reset language when category changes
          }}
          required
        >
          <option value="history">📜 History & Culture</option>
          <option value="language">🗣️ Language</option>
          <option value="health">🏥 Health & Wellbeing</option>
          <option value="career">🎓 Career & Education</option>
        </select>

        {/* Language sub-selection - only show if language category */}
        {category === "language" && (
          <>
            <label>Language *</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
            >
              <option value="">Select language...</option>
              <option value="adara">🪨 Adara</option>
              <option value="hausa">Hausa</option>
              <option value="english">🇬🇧 English</option>
            </select>
          </>
        )}

        <label>Cover Image (Max 5MB)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
        />
        {fileError && (
          <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
        )}

        <label>YouTube Link (optional)</label>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeLink}
          onChange={(e) => setYoutubeLink(e.target.value)}
        />

        <label>Content</label>
        <Editor onChange={setContent} value={content} />

        <button type="submit" style={{ marginTop: "15px" }}>
          Publish 📚
        </button>
      </form>
    </div>
  );
}
