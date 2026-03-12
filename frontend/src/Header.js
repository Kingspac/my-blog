import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetch("http://localhost:4000/api/profile", {
      credentials: "include",
    }).then((response) => {
      response.json().then((userInfo) => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  useEffect(() => {
    checkNewMessages();
    const interval = setInterval(checkNewMessages, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  async function checkNewMessages() {
    if (location.pathname === "/room") {
      setNewMessageCount(0);
      return;
    }
    try {
      const res = await fetch("http://localhost:4000/api/room/count");
      const data = await res.json();
      const totalCount = data.count;
      const lastSeen = parseInt(
        localStorage.getItem("lastSeenMessageCount") || "0"
      );
      if (totalCount > lastSeen) {
        setNewMessageCount(totalCount - lastSeen);
      } else {
        setNewMessageCount(0);
      }
    } catch (e) {
      // silently fail
    }
  }

  function handleRoomClick() {
    setNewMessageCount(0);
  }

  function logout() {
    fetch("http://localhost:4000/api/logout", {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
  }

  const username = userInfo?.username;
  const id = userInfo?.id;

  return (
    <header>
      <Link to="/" className="logo">Enchwra</Link>
      <nav>
        {/* Visible to everyone */}
        <Link to="/blog">Blog</Link>
        <Link to="/entertainment">Entertainment</Link>
        <Link to="/education">📚 Education</Link>

        {/* Room with notification badge */}
        <Link to="/room" className="room-link" onClick={handleRoomClick}>
          🪨 Room
          {newMessageCount > 0 && (
            <span className="notification-badge">
              {newMessageCount > 99 ? "99+" : newMessageCount}
            </span>
          )}
        </Link>

        {/* Logged in */}
        {username && (
          <>
            <Link to={`/profile/${id}`}>👤 {username}</Link>
            <a onClick={logout}>Logout</a>
          </>
        )}

        {/* Logged out */}
        {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
