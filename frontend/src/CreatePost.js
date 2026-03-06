import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {useState} from "react";
import {Navigate} from "react-router-dom";

const modules = {
    toolbar: [
  [{ 'header': [1, 2, false] }],// Headers 1, 2, or normal
  [{ 'font': [] }], // Font family dropdown
  [{ size: [] }],// Font size dropdown
  ['bold', 'italic', 'underline', 'strike', 'blockquote'], // Basic text styles
  [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}], // Lists and indentation
  ['link', 'image', 'video'],   // Inserts for link, image, and video
  ['clean'] // Button to remove formatting
]
  };
  const formats =[
      'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'ordered','list','bullet','indent', 
  'link', 'image', 'video',
  'clean'
    ];

export default function CreatePost(){
  const [title,setTitle] = useState("");
  const [summary,setSummary] = useState("");
  const [content,setContent] = useState("");
  const [files, setFiles] = useState("");
  const [redirect, setRedirect] = useState(false);
  
  async function creatNewPost(e){
    e.preventDefault();
    const data = new FormData();
    data.set("title", title);
    data.set("summary", summary);
    data.set("content", content);
    data.set("files", files[0])
    
    const response = await fetch("http://localhost:4000/api/post", {
      method:"POST",
      body:data,
    });
    if(response.ok){
      setRedirect(true);
    }
  }
  
    if(redirect){
      return <Navigate to={"/"}/>;
    }
  
  return(
    <form onSubmit={creatNewPost}>
      <input type="title"
      placeholder={"Title"}
      value={title}
      onChange={e => setTitle(e.target.value)}/>
      <input type="summary"
      placeholder={"Summary"}
      value={summary}
      onChange={e => setSummary(e.target.value)}/>
      <input type="file"
      onChange={e => setFiles(e.target.files)}/>
      <ReactQuill
      value={content} 
      onChange={newValue => setContent(newValue)}
      modules={modules}
      formats={formats}/>
      <button style={{marginTop:"5px"}}> Create Post </button>
    </form>
    );
}