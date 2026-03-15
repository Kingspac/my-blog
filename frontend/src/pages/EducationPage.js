import { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { formatISO9075 } from "date-fns";
import { UserContext } from "../UserContext";

function getYoutubeId(url) {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function EducationPostPage() {
  const [postInfo, setPostInfo] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const { userInfo } = useContext(UserContext);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/education/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPostInfo(data);
        setLikes(data.likes?.length || 0);
        if (userInfo?.id) {
          setLiked(data.likes?.includes(userInfo.id));
        }
      });
  }, [id]);

  async function handleLike() {
    if (!userInfo?.id) {
      alert("Please login to like this content");
      return;
    }
    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/education/${id}/like`, {
      method: "PUT",
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      setLiked(data.liked);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this?");
    if (!confirmed) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/education/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      alert("Deleted successfully!");
      navigate("/education");
    } else {
      alert("Failed to delete");
    }
  }

  if (!postInfo) return "";

  return (
    <div className="education-post-page">

      {/* Cover Image */}
      {postInfo.cover && !postInfo.youtubeLink && (
        <div className="education-post-cover">
          <img
            src={`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/${postInfo.cover}`}
            alt={postInfo.title}
          />
        </div>
      )}

      {/* YouTube Embed */}
      {postInfo.youtubeLink && (
        <div className="youtube-embed">
          <iframe
            width="100%"
            height="300"
            src={`https://www.youtube.com/embed/${getYoutubeId(postInfo.youtubeLink)}`}
            title={postInfo.title}
            frameBorder="0"
            allowFullScreen
          />
        </div>
      )}

      {/* Badges */}
      <div className="education-badges" style={{ marginTop: "15px" }}>
        <span className="education-category">{postInfo.category}</span>
        {postInfo.language && (
          <span className="education-language">{postInfo.language}</span>
        )}
      </div>

      <h1>{postInfo.title}</h1>
      <time>{formatISO9075(new Date(postInfo.createdAt))}</time>
      <div className="author">
        ✍️ By{" "}
        <Link to={`/profile/${postInfo.author?._id}`}>
          {postInfo.author?.username}
        </Link>
      </div>

      {/* Edit and Delete - only for author */}
      {userInfo?.id === postInfo.author?._id && (
        <div className="edit-row">
          <Link className="edit-btn" to={`/education/edit/${postInfo._id}`}>
            Edit
          </Link>
          <button className="delete-btn" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}

      {/* Content */}
      <div
        className="content"
        dangerouslySetInnerHTML={{ __html: postInfo.content }}
      />

      {/* Like Button */}
      <div className="like-section">
        <button
          className={`like-btn ${liked ? "liked" : ""}`}
          onClick={handleLike}
        >
          {liked ? "❤️" : "🤍"} {likes} {likes === 1 ? "Like" : "Likes"}
        </button>
      </div>

      {/* Back to Education */}
      <div style={{ marginTop: "20px" }}>
        <Link to="/education" style={{ color: "#333", fontSize: "0.9rem" }}>
          ← Back to Education
        </Link>
      </div>
    </div>
  );
}
