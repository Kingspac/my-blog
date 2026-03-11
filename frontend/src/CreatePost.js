import {useState} from "react";
import {useNavigate} from "react-router-dom"; // ← useNavigate instead of Navigate
import Editor from "./Editor";

export default function CreatePost(){
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [fileError, setFileError] = useState(""); // ← new: for error message
  
  const navigate = useNavigate(); // ← useNavigate hook

  // FILE VALIDATION function
  function handleFileChange(e) {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    if (file.size > maxSize) {
      setFileError("Image is too large! Please upload an image smaller than 5MB.");
      e.target.value = ""; // clear the file input
      setFiles(""); // clear files state
      return;
    }

    setFileError(""); // clear any previous error
    setFiles(e.target.files); // only set if size is okay ✅
  }

  async function creatNewPost(e){
    e.preventDefault();

    // Stop if file has error or no file selected
    if (fileError) return;

    const data = new FormData();
    data.append("title", title);     // ← changed from set() to append()
    data.append("summary", summary);
    data.append("content", content);
    data.append("files", files[0]);

    const response = await fetch("http://localhost:4000/api/post", {
      method: "POST",
      body: data,
      credentials: "include",
    });

    if(response.ok){
      navigate("/"); // ← useNavigate instead of Navigate component
    }
  }

  return(
    <form onSubmit={creatNewPost}>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Summary"
        value={summary}
        onChange={e => setSummary(e.target.value)}
      />
      <input
        type="file"
        onChange={handleFileChange} // ← new validation function
      />
      {/* Show error message if file is too large */}
      {fileError && <p style={{color: "red", fontSize: "0.85rem"}}>{fileError}</p>}

      <Editor onChange={setContent} value={content}/>
      <button style={{marginTop:"5px"}}>Create Post</button>
    </form>
  );
}