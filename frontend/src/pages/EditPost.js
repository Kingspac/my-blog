import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "../Editor";
import styles from "../styles/Editor.module.css";

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [coverPreview, setCoverPreview] = useState(null);
  const [fileError, setFileError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post/` + id, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch post");
        return response.json();
      })
      .then((postInfo) => {
        setTitle(postInfo.title);
        setContent(postInfo.content);
        setSummary(postInfo.summary);
        setExistingCover(postInfo.cover);
      })
      .catch((err) => console.error(err));
  }, []);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setFileError("Image too large! Max 20MB.");
      e.target.value = "";
      setFiles(null);
      setCoverPreview(null);
      return;
    }

    setFileError("");
    setFiles(e.target.files);

    const previewURL = URL.createObjectURL(file);
    setCoverPreview(previewURL);
  }

  function removeNewCover() {
    setFiles(null);
    setCoverPreview(null);
    setFileError("");
    const fileInput = document.getElementById("cover-input");
    if (fileInput) fileInput.value = "";
  }

  function removeEditorImages() {
    const confirmed = window.confirm(
      "This will remove all images inside the editor. Continue?"
    );
    if (!confirmed) return;
    const stripped = content.replace(/<img[^>]*>/g, "");
    setContent(stripped);
  }

  async function updatePost(e) {
    e.preventDefault();
    if (fileError) return;

    const data = new FormData();
    data.append("title", title);
    data.append("summary", summary);
    data.append("content", content);
    data.append("id", id);

    if (files?.[0]) {
      data.append("cover", files[0]);
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post`, {
      method: "PUT",
      body: data,
      credentials: "include",
    });

    if (response.ok) {
      navigate("/post/" + id);
    }
  }

  return (
    <form onSubmit={updatePost}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />

      {/* EXISTING COVER */}
      {existingCover && !coverPreview && (
        <div className={styles.coverPreview}>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>Current cover image:</p>
          <img
            src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/` + existingCover}
            alt="current cover"
          />
        </div>
      )}

      {/* NEW COVER PREVIEW */}
      {coverPreview && (
        <div className={styles.coverPreview}>
          <p style={{ fontSize: "0.85rem", color: "#666" }}>New cover image:</p>
          <img src={coverPreview} alt="new cover preview" />
          <button
            type="button"
            className={styles.removeCoverBtn}
            onClick={removeNewCover}
          >
            ❌ Remove New Image
          </button>
        </div>
      )}

      {/* FILE INPUT */}
      <input
        id="cover-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      {fileError && (
        <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
      )}

      {/* EDITOR */}
      <div className={styles.editorWrapper}>
        <Editor onChange={setContent} value={content} />

        {content.includes("<img") && (
          <button
            type="button"
            className={styles.removeImagesBtn}
            onClick={removeEditorImages}
          >
            🗑️ Remove All Images from Editor
          </button>
        )}
      </div>

      <button style={{ marginTop: "5px" }}>Update Post</button>
    </form>
  );
}
