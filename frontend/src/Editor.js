import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useState, useRef, useEffect } from "react";

export default function Editor({ value, onChange }) {
  const quillRef = useRef(null);
  const [editorImages, setEditorImages] = useState([]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      [{ font: [] }],
      [{ size: [] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["link", "image", "video"],
      ["clean"],
    ],
  };

  // Every time content changes, scan for images and update image list
  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    const srcs = imgs.map((img) => img.src);
    setEditorImages(srcs);
  }, [value]);

  // Remove a specific image by its src
  function removeImage(src) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));

    // Find and remove the matching image
    imgs.forEach((img) => {
      if (img.src === src) {
        img.remove();
      }
    });

    // Get updated HTML and send back to parent
    const updated = doc.body.innerHTML;
    onChange(updated);
  }

  return (
    <div>
      {/* THE EDITOR */}
      <ReactQuill
        ref={quillRef}
        value={value}
        theme="snow"
        onChange={onChange}
        modules={modules}
      />

      {/* IMAGE MANAGER — shows below editor when images exist */}
      {editorImages.length > 0 && (
        <div className="editor-image-manager">
          <p className="editor-image-manager-title">
            🖼️ Images in editor — tap ❌ to remove:
          </p>
          <div className="editor-image-list">
            {editorImages.map((src, index) => (
              <div key={index} className="editor-image-item">
                <img src={src} alt={`editor-img-${index}`} />
                <button
                  type="button"
                  className="editor-image-remove-btn"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeImage(src);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    removeImage(src);
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
