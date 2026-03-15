import Post from "../Post.js";
import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const { userInfo } = useContext(UserContext);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/post`)
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div>

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>📝 Blog</h2>
        <p>Stories, thoughts and voices of the Adara people</p>

        {userInfo?.id && (
          <Link to="/create" className="create-btn">
            + Create Post
          </Link>
        )}
      </div>

      {/* POSTS ONLY */}
      {posts.length === 0 && (
        <p className="no-content">No posts yet. Be the first to write!</p>
      )}

      {posts.map((post) => (
        <Post key={post._id} {...post} />
      ))}

    </div>
  );
}
