import {useContext, useEffect, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {formatISO9075} from "date-fns";
import {UserContext} from "../UserContext";
import styles from "../styles/Post.module.css";

export default function PostPage(){
  const [postInfo, setPostInfo] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");

  const {userInfo} = useContext(UserContext);
  const {id} = useParams();
  const navigate = useNavigate();

  const postURL = window.location.href;

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post/${id}`)
      .then(response => {
        response.json().then(data => {
          setPostInfo(data);
          setLikes(data.likes?.length || 0);
          setComments(data.comments || []);
          if(userInfo?.id){
            setLiked(data.likes?.includes(userInfo.id));
          }
        });
      });
  }, []);

  async function deletePost() {
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post/${id}`, {
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

  async function handleLike() {
    if (!userInfo?.id) {
      alert("Please login to like this post");
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post/${id}/like`, {
      method: "PUT",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  async function handleComment(e) {
    e.preventDefault();

    if (!userInfo?.id) {
      alert("Please login to comment");
      return;
    }

    if (!comment.trim()) return;

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post/${id}/comment`, {
      method: "POST",
      credentials: "include",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({content: comment}),
    });

    if (response.ok) {
      const newComment = await response.json();
      setComments([...comments, newComment]);
      setComment("");
    }
  }

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
    <div className={styles.postPage}>

      {/* COVER IMAGE */}
      <div className={styles.image}>
        <img src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${postInfo.cover}`} alt="post-image"/>
      </div>

      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}</time>

      <div className={styles.author}>
        By <Link to={`/profile/${postInfo.author._id}`} style={{color: "#333"}}>
          {postInfo.author.username}
        </Link>
      </div>

      {/* Edit and Delete — only for the author */}
      {userInfo?.id === postInfo.author._id && (
        <div className={styles.editRow}>
          <Link className={styles.editBtn} to={`/edit/${postInfo._id}`}>Edit Post</Link>
          <button className={styles.deleteBtn} onClick={deletePost}>Delete Post</button>
        </div>
      )}

      {/* POST CONTENT */}
      <div className={styles.content} dangerouslySetInnerHTML={{__html: postInfo.content}}/>

      {/* LIKE BUTTON */}
      <div className={styles.likeSection}>
        <button
          className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"} {likes} {likes === 1 ? "Like" : "Likes"}
        </button>
      </div>

      {/* SHARE BUTTONS */}
      <div className={styles.shareSection}>
        <h4>Share this post:</h4>
        <div className={styles.shareButtons}>
          <button className={`${styles.shareBtn} ${styles.whatsapp}`} onClick={shareToWhatsApp}>
            📱 WhatsApp
          </button>
          <button className={`${styles.shareBtn} ${styles.facebook}`} onClick={shareToFacebook}>
            📘 Facebook
          </button>
          <button className={`${styles.shareBtn} ${styles.twitter}`} onClick={shareToTwitter}>
            🐦 Twitter
          </button>
          <button className={`${styles.shareBtn} ${styles.copy}`} onClick={copyLink}>
            🔗 Copy Link
          </button>
        </div>
      </div>

      {/* COMMENTS SECTION */}
      <div className={styles.commentsSection}>
        <h4>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</h4>

        {/* Comment form — only for logged in users */}
        {userInfo?.id && (
          <form className={styles.commentForm} onSubmit={handleComment}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button type="submit">Post</button>
          </form>
        )}

        {/* All comments */}
        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((c, index) => (
            <div className={styles.comment} key={index}>
              <div className={styles.commentAuthor}>👤 {c.username}</div>
              <div className={styles.commentContent}>{c.content}</div>
              <div className={styles.commentDate}>
                {formatISO9075(new Date(c.createdAt))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
