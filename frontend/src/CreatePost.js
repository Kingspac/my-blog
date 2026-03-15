import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "./Editor";
import styles from "./styles/Editor.module.css";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState(null);
  const [fileError, setFileError] = useState("");
  const [coverPreview, setCoverPreview] = useState(null);

  const navigate = useNavigate();

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setFileError("Image is too large! Please upload an image smaller than 20MB.");
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

  function removeCoverImage() {
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

  async function createNewPost(e) {
    e.preventDefault();
    if (fileError) return;

    const data = new FormData();
    data.append("title", title);
    data.append("summary", summary);
    data.append("content", content);

    if (files) {
      data.append("cover", files[0]);
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post`, {
      method: "POST",
      body: data,
      credentials: "include",
    });

    if (response.ok) {
      navigate("/");
    }
  }

  return (
    <form onSubmit={createNewPost}>
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

      {/* COVER IMAGE INPUT */}
      <input
        id="cover-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* ERROR MESSAGE */}
      {fileError && (
        <p style={{ color: "red", fontSize: "0.85rem" }}>{fileError}</p>
      )}

      {/* COVER IMAGE PREVIEW */}
      {coverPreview && (
        <div className={styles.coverPreview}>
          <img src={coverPreview} alt="Cover preview" />
          <button
            type="button"
            className={styles.removeCoverBtn}
            onClick={removeCoverImage}
          >
            ❌ Remove Cover Image
          </button>
        </div>
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

      <button style={{ marginTop: "5px" }}>Create Post</button>
    </form>
  );
}
