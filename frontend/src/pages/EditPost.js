import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // ✅ useNavigate not Navigate
import Editor from "../Editor";

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState(null);
  const [existingCover, setExistingCover] = useState("");
  const [coverPreview, setCoverPreview] = useState(null); // ← new cover preview
  const [fileError, setFileError] = useState("");

  const navigate = useNavigate(); // ✅ useNavigate hook

  useEffect(() => {
    fetch("http://localhost:4000/api/post/" + id, {
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

  // Handle new cover image selection
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

    // Show preview of new image
    const previewURL = URL.createObjectURL(file);
    setCoverPreview(previewURL);
  }

  // Remove newly selected cover image
  function removeNewCover() {
    setFiles(null);
    setCoverPreview(null);
    setFileError("");
    const fileInput = document.getElementById("cover-input");
    if (fileInput) fileInput.value = "";
  }

  // Remove images inside editor
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
    data.append("title", title);       // ✅ append not set
    data.append("summary", summary);   // ✅ append not set
    data.append("content", content);   // ✅ append not set
    data.append("id", id);             // ✅ append not set

    // Only append cover if new one was selected
    if (files?.[0]) {
      data.append("cover", files[0]);  // ✅ "cover" matches backend
    }

    const response = await fetch("http://localhost:4000/api/post", {
      method: "PUT",
      body: data,
      credentials: "include",
    });

    if (response.ok) {
      navigate("/post/" + id); // ✅ useNavigate not Navigate component
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

      {/* EXISTING COVER - show current image */}
      {existingCover && !coverPreview && (
        <div className="cover-preview">
          <p style={{ fontSize: "0.85rem", color: "#666" }}>Current cover image:</p>
          <img
            src={"http://localhost:4000/" + existingCover}
            alt="current cover"
          />
        </div>
      )}

      {/* NEW COVER - show preview with remove button */}
      {coverPreview && (
        <div className="cover-preview">
          <p style={{ fontSize: "0.85rem", color: "#666" }}>New cover image:</p>
          <img src={coverPreview} alt="new cover preview" />
          <button
            type="button"
            className="remove-cover-btn"
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

      {/* EDITOR with remove images button */}
      <div className="editor-wrapper">
        <Editor onChange={setContent} value={content} />

        {content.includes("<img") && (
          <button
            type="button"
            className="remove-images-btn"
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
