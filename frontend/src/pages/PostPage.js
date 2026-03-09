import {useContext, useEffect, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {formatISO9075} from "date-fns";
import {UserContext} from "../UserContext";

export default function PostPage(){
  const [postInfo, setPostInfo] = useState(null);
  const {userInfo} = useContext(UserContext);
  const {id} = useParams();
  const navigate = useNavigate();

  // The full URL of this post — used for sharing
  const postURL = window.location.href;
  useEffect(() => {
    fetch(`http://localhost:4000/api/post/${id}`)
      .then(response => {
        response.json().then(postInfo => {
          setPostInfo(postInfo);
        });
      });
  }, []);

  // DELETE function
  async function deletePost() {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const response = await fetch(`http://localhost:4000/api/post/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      alert("Post deleted successfully!");
      navigate("/");
    } else {
      alert("Failed to delete post");
    }
  }

  // SHARE functions
  function shareToWhatsApp() {
    const message = `Check out this post on Enchwra: ${postInfo.title} - ${postURL}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postURL)}`, "_blank");
  }

  function shareToTwitter() {
    const text = `Check out this post on Enchwra: ${postInfo.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postURL)}`, "_blank");
  }

  function copyLink() {
    navigator.clipboard.writeText(postURL);
    alert("Link copied to clipboard!");
  }

  if (!postInfo) return "";

  return (
    <div className="post-page">
      <div className="image">
        <img src={`http://localhost:4000/${postInfo.cover}`} alt="post-image"/>
      </div>
      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
      <div className="author">By {postInfo.author.username}</div>

      {/* Edit and Delete buttons — only for the author */}
      {userInfo?.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>Edit Post</Link>
          <button className="delete-btn" onClick={deletePost}>Delete Post</button>
        </div>
      )}

      <div className="content" dangerouslySetInnerHTML={{__html: postInfo.content}}/>

      {/* Share buttons — visible to everyone */}
      <div className="share-section">
        <h4>Share this post:</h4>
        <div className="share-buttons">
          <button className="share-btn whatsapp" onClick={shareToWhatsApp}>
            📱 WhatsApp
          </button>
          <button className="share-btn facebook" onClick={shareToFacebook}>
            📘 Facebook
          </button>
          <button className="share-btn twitter" onClick={shareToTwitter}>
            🐦 Twitter
          </button>
          <button className="share-btn copy" onClick={copyLink}>
            🔗 Copy Link
          </button>
        </div>
      </div>
    </div>
  );
}