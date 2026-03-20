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
      ["link", "image"],
      ["clean"],
    ],
  };

  // Scan for images every time content changes
  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    setEditorImages(imgs.map((img) => img.src));
  }, [value]);

  // Remove a specific image by src
  function removeImage(src) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      if (img.src === src) img.remove();
    });
    onChange(doc.body.innerHTML);
  }

  return (
    <div className="editor-container">
      <style>{`
        /* ===== STICKY QUILL TOOLBAR ===== */
        .editor-container .ql-toolbar {
          position: sticky !important;
          top: 58px; /* below the header */
          z-index: 50;
          background: #1a1209 !important;
          border: none !important;
          border-bottom: 2px solid rgba(205,133,63,0.4) !important;
          border-radius: 0 !important;
          padding: 6px 12px !important;
          margin-top: 0 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        /* Toolbar icons - make them visible on dark background */
        .editor-container .ql-toolbar .ql-stroke {
          stroke: #CD853F !important;
        }

        .editor-container .ql-toolbar .ql-fill {
          fill: #CD853F !important;
        }

        .editor-container .ql-toolbar .ql-picker {
          color: #CD853F !important;
        }

        .editor-container .ql-toolbar button:hover .ql-stroke,
        .editor-container .ql-toolbar button.ql-active .ql-stroke {
          stroke: #DAA520 !important;
        }

        .editor-container .ql-toolbar button:hover .ql-fill,
        .editor-container .ql-toolbar button.ql-active .ql-fill {
          fill: #DAA520 !important;
        }

        .editor-container .ql-toolbar .ql-picker-options {
          background: #1a1209 !important;
          border: 1px solid rgba(205,133,63,0.3) !important;
          color: #CD853F !important;
        }

        /* Editor content area */
        .editor-container .ql-container {
          border: 1px solid rgba(205,133,63,0.2) !important;
          border-top: none !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 1rem !important;
          min-height: 200px;
          background: white;
        }

        .editor-container .ql-editor {
          min-height: 200px;
          line-height: 1.8 !important;
          color: #2d2420 !important;
          padding: 16px !important;
        }

        /* Placeholder text */
        .editor-container .ql-editor.ql-blank::before {
          color: #aaa !important;
          font-style: italic !important;
        }
      `}</style>

      {/* THE EDITOR */}
      <ReactQuill
        ref={quillRef}
        value={value}
        theme="snow"
        onChange={onChange}
        modules={modules}
        placeholder="Write your post content here..."
      />

      {/* IMAGE MANAGER */}
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
 