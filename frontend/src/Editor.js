import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
export default function Editor({value,onChange}){
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
  /*const formats =[
      'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'ordered','list','bullet','indent', 
  'link', 'image', 'video',
  'clean'
    ];*/
  return(
      <ReactQuill
      value={value} 
      theme={"snow"}
      onChange={onChange}
      modules={modules} />
      //formats={formats}/>
    );
}