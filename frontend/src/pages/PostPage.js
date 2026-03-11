import {useContext, useEffect, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {formatISO9075} from "date-fns";
import {UserContext} from "../UserContext";

export default function PostPage(){
  const [postInfo, setPostInfo] = useState(null);
  const [likes, setLikes] = useState(0);         // total like count
  const [liked, setLiked] = useState(false);     // has current user liked?
  const [comments, setComments] = useState([]);  // all comments
  const [comment, setComment] = useState("");    // current comment being typed

  const {userInfo} = useContext(UserContext);
  const {id} = useParams();
  const navigate = useNavigate();

  const postURL = window.location.href;

  useEffect(() => {
    fetch(`http://localhost:4000/api/post/${id}`)
      .then(response => {
        response.json().then(data => {
          setPostInfo(data);

          // Initialize likes and comments from the post data
          setLikes(data.likes?.length || 0);
          setComments(data.comments || []);

          // Check if current user already liked this post
          if(userInfo?.id){
            setLiked(data.likes?.includes(userInfo.id));
          }
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

  // LIKE / UNLIKE function
  async function handleLike() {
    // If user is not logged in, stop
    if (!userInfo?.id) {
      alert("Please login to like this post");
      return;
    }

    const response = await fetch(`http://localhost:4000/api/post/${id}/like`, {
      method: "PUT",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      setLikes(data.likes);   // update like count
      setLiked(data.liked);   // update liked status
    }
  }

  // ADD COMMENT function
  async function handleComment(e) {
    e.preventDefault();

    // If user is not logged in, stop
    if (!userInfo?.id) {
      alert("Please login to comment");
      return;
    }

    if (!comment.trim()) return; // stop if comment is empty

    const response = await fetch(`http://localhost:4000/api/post/${id}/comment`, {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({content: comment}),
    });

    if (response.ok) {
      const newComment = await response.json();
      setComments([...comments, newComment]); // add new comment to list
      setComment(""); // clear the input field
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
      <div className="author">
  By <Link to={`/profile/${postInfo.author._id}`} style={{color: "#333"}}>
    {postInfo.author.username}
  </Link>
</div>

      {/* Edit and Delete buttons — only for the author */}
      {userInfo?.id === postInfo.author._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/edit/${postInfo._id}`}>Edit Post</Link>
          <button className="delete-btn" onClick={deletePost}>Delete Post</button>
        </div>
      )}

      <div className="content" dangerouslySetInnerHTML={{__html: postInfo.content}}/>

      {/* LIKE BUTTON */}
      <div className="like-section">
        <button
          className={`like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"} {likes} {likes === 1 ? "Like" : "Likes"}
        </button>
      </div>

      {/* SHARE BUTTONS */}
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

      {/* COMMENTS SECTION */}
      <div className="comments-section">
        <h4>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</h4>

        {/* Comment form — only for logged in users */}
        {userInfo?.id && (
          <form className="comment-form" onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        )}

        {/* Display all comments */}
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((c, index) => (
            <div className="comment" key={index}>
              <div className="comment-author">👤 {c.username}</div>
              <div className="comment-content">{c.content}</div>
              <div className="comment-date">
                {formatISO9075(new Date(c.createdAt))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}