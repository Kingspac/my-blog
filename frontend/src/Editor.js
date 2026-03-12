import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useEffect, useRef } from "react";

export default function Editor({ value, onChange }) {
  const quillRef = useRef(null);

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

  useEffect(() => {
    // Wait for editor to mount
    const interval = setInterval(() => {
      const editor = document.querySelector(".ql-editor");
      if (!editor) return;

      clearInterval(interval);

      // Listen for clicks inside the editor
      editor.addEventListener("click", (e) => {
        // Remove any existing delete buttons first
        document.querySelectorAll(".img-delete-btn").forEach((btn) => btn.remove());

        // Check if user clicked on an image
        if (e.target.tagName === "IMG") {
          const img = e.target;

          // Create ❌ delete button
          const btn = document.createElement("button");
          btn.innerText = "❌";
          btn.className = "img-delete-btn";
          btn.type = "button";

          // Position the button on top of the image
          const imgRect = img.getBoundingClientRect();
          const editorRect = editor.getBoundingClientRect();

          btn.style.position = "absolute";
          btn.style.top = (imgRect.top - editorRect.top + editor.scrollTop) + "px";
          btn.style.left = (imgRect.left - editorRect.left + imgRect.width - 36) + "px";
          btn.style.zIndex = "1000";
          btn.style.background = "red";
          btn.style.color = "white";
          btn.style.border = "none";
          btn.style.borderRadius = "50%";
          btn.style.width = "30px";
          btn.style.height = "30px";
          btn.style.cursor = "pointer";
          btn.style.fontSize = "14px";
          btn.style.display = "flex";
          btn.style.alignItems = "center";
          btn.style.justifyContent = "center";

          // When ❌ is clicked → remove the image
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            img.remove();
            btn.remove();
            // Trigger onChange so React state updates
            onChange(editor.innerHTML);
          });

          // Add button inside editor (relatively positioned)
          editor.style.position = "relative";
          editor.appendChild(btn);
        }
      });

      // Click anywhere else → remove delete button
      document.addEventListener("click", (e) => {
        if (!e.target.classList.contains("img-delete-btn") && e.target.tagName !== "IMG") {
          document.querySelectorAll(".img-delete-btn").forEach((btn) => btn.remove());
        }
      });
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      theme="snow"
      onChange={onChange}
      modules={modules}
    />
  );
}
