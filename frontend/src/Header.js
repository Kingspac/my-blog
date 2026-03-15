import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import styles from "./styles/Header.module.css";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/profile`, {
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room/count`);
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
    fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/logout`, {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
  }

  const username = userInfo?.username;
  const id = userInfo?.id;

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>Enchwra</Link>
      <nav className={styles.nav}>

        {/* Visible to everyone */}
        <Link to="/blog">Blog</Link>
        <Link to="/entertainment">Entertainment</Link>
        <Link to="/education">📚 Education</Link>

        {/* Room with notification badge */}
        <Link to="/room" className={styles.roomLink} onClick={handleRoomClick}>
          🪨 Room
          {newMessageCount > 0 && (
            <span className={styles.notificationBadge}>
              {newMessageCount > 99 ? "99+" : newMessageCount}
            </span>
          )}
        </Link>

        {/* Logged in */}
        {username && (
          <>
            <Link to={`/profile/${id}`}>👤 {username}</Link>
            <a onClick={logout} style={{ cursor: "pointer" }}>Logout</a>
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