import {useState, useEffect} from "react";
import {Navigate, useParams} from "react-router-dom";
import Editor from "../Editor";

export default function EditPost(){
  const {id} = useParams();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [existingCover, setExistingCover] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/api/post/" + id, {
      credentials: "include",
    })
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch post");
        return response.json();
      })
      .then(postInfo => {
        setTitle(postInfo.title);
        setContent(postInfo.content);
        setSummary(postInfo.summary);
        setExistingCover(postInfo.cover);
      })
      .catch(err => console.error(err));
  }, []);

  async function updatePost(e) {
    e.preventDefault();
    const data = new FormData();
    data.set("title", title);
    data.set("summary", summary);
    data.set("content", content);
    data.set("id", id);
    if (files?.[0]) {
      data.set("file", files[0]);
    }

    const response = await fetch("http://localhost:4000/api/post", {
      method: "PUT",
      body: data,
      credentials: "include",
    });

    if (response.ok) {
      setRedirect(true);
    }
  }

  if (redirect) {
    return <Navigate to={"/post/" + id} />;
  }

  return (
    <form onSubmit={updatePost}>
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
      {existingCover && (
        <div>
          <p>Current image:</p>
          <img
            src={"http://localhost:4000/" + existingCover}
            alt="current cover"
            style={{width: "200px", marginBottom: "10px"}}
          />
        </div>
      )}
      <input
        type="file"
        onChange={e => setFiles(e.target.files)}
      />
      {files?.[0] && (
        <p style={{fontSize: "12px", color: "gray"}}>
          New image selected: {files[0].name}
        </p>
      )}
      <Editor onChange={setContent} value={content} />
      <button style={{marginTop: "5px"}}>Update Post</button>
    </form>
  );
}