import {useContext, useEffect, useState} from "react";
import {useParams, Link, useNavigate} from "react-router-dom";
import {formatISO9075} from "date-fns";
import {UserContext} from "../UserContext";
import { motion } from "framer-motion";
import styles from "../styles/Post.module.css";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

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
    fetch(`${apiUrl}/api/post/${id}`)
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
    const response = await fetch(`${apiUrl}/api/post/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      navigate("/blog");
    } else {
      alert("Failed to delete post");
    }
  }

  async function handleLike() {
    if (!userInfo?.id) { alert("Please login to like this post"); return; }
    const response = await fetch(`${apiUrl}/api/post/${id}/like`, {
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
    if (!userInfo?.id) { alert("Please login to comment"); return; }
    if (!comment.trim()) return;
    const response = await fetch(`${apiUrl}/api/post/${id}/comment`, {
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
    window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this post on Enchwra: ${postInfo.title} - ${postURL}`)}`, "_blank");
  }
  function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postURL)}`, "_blank");
  }
  function shareToTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out: ${postInfo.title}`)}&url=${encodeURIComponent(postURL)}`, "_blank");
  }
  function copyLink() {
    navigator.clipboard.writeText(postURL);
    alert("Link copied!");
  }

  if (!postInfo) return "";

  return (
    <motion.div
      className={styles.postPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* COVER IMAGE - full width, proper height */}
      {postInfo.cover && (
        <div className={styles.coverImage}>
          <img
            src={`${apiUrl}/${postInfo.cover}`}
            alt={postInfo.title}
          />
        </div>
      )}

      {/* POST HEADER */}
      <div className={styles.postHeader}>
        <h1>{postInfo.title}</h1>

        <div className={styles.postMeta}>
          <span className={styles.postAuthor}>
            ✍️{" "}
            <Link to={`/profile/${postInfo.author._id}`}>
              {postInfo.author.username}
            </Link>
          </span>
          <time className={styles.postTime}>
            {formatISO9075(new Date(postInfo.createdAt))}
          </time>
        </div>

        {/* Edit/Delete — author only */}
        {userInfo?.id === postInfo.author._id && (
          <div className={styles.editRow}>
            <Link className={styles.editBtn} to={`/edit/${postInfo._id}`}>
              ✏️ Edit
            </Link>
            <button className={styles.deleteBtn} onClick={deletePost}>
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {/* POST CONTENT - images inside get 100% width */}
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{__html: postInfo.content}}
      />

      {/* LIKE BUTTON */}
      <div className={styles.likeSection}>
        <motion.button
          className={`${styles.likeBtn} ${liked ? styles.liked : ""}`}
          onClick={handleLike}
          whileTap={{ scale: 1.2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {liked ? "❤️" : "🤍"} {likes} {likes === 1 ? "Like" : "Likes"}
        </motion.button>
      </div>

      {/* SHARE BUTTONS */}
      <div className={styles.shareSection}>
        <h4>Share this post:</h4>
        <div className={styles.shareButtons}>
          <motion.button
            className={`${styles.shareBtn} ${styles.whatsapp}`}
            onClick={shareToWhatsApp}
            whileTap={{ scale: 0.95 }}
          >
            📱 WhatsApp
          </motion.button>
          <motion.button
            className={`${styles.shareBtn} ${styles.facebook}`}
            onClick={shareToFacebook}
            whileTap={{ scale: 0.95 }}
          >
            📘 Facebook
          </motion.button>
          <motion.button
            className={`${styles.shareBtn} ${styles.twitter}`}
            onClick={shareToTwitter}
            whileTap={{ scale: 0.95 }}
          >
            🐦 Twitter
          </motion.button>
          <motion.button
            className={`${styles.shareBtn} ${styles.copy}`}
            onClick={copyLink}
            whileTap={{ scale: 0.95 }}
          >
            🔗 Copy
          </motion.button>
        </div>
      </div>

      {/* COMMENTS */}
      <div className={styles.commentsSection}>
        <h4>{comments.length} {comments.length === 1 ? "Comment" : "Comments"}</h4>

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

        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet. Be the first!</p>
        ) : (
          comments.map((c, index) => (
            <motion.div
              className={styles.comment}
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className={styles.commentAuthor}>👤 {c.username}</div>
              <div className={styles.commentContent}>{c.content}</div>
              <div className={styles.commentDate}>
                {formatISO9075(new Date(c.createdAt))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
