import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserContext } from "./UserContext";
import styles from "./styles/Header.module.css";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false); // hide home btn when typing
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Hide/show header on scroll
  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Listen for Room page hide/show events
  useEffect(() => {
    function hideBtn() { setNavVisible(false); }
    function showBtn() { setNavVisible(true); }
    window.addEventListener("hideHomeBtn", hideBtn);
    window.addEventListener("showHomeBtn", showBtn);
    return () => {
      window.removeEventListener("hideHomeBtn", hideBtn);
      window.removeEventListener("showHomeBtn", showBtn);
    };
  }, []);

  // Hide home button when user focuses on any input or textarea
  useEffect(() => {
    function handleFocusIn(e) {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.contentEditable === "true"
      ) {
        setIsTyping(true);
      }
    }
    function handleFocusOut(e) {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.contentEditable === "true"
      ) {
        // Small delay so it doesn't flicker
        setTimeout(() => setIsTyping(false), 300);
      }
    }
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  async function checkNewMessages() {
    if (location.pathname === "/room") {
      setNewMessageCount(0);
      return;
    }
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room/count`
      );
      const data = await res.json();
      const totalCount = data.count;
      const lastSeen = parseInt(localStorage.getItem("lastSeenMessageCount") || "0");
      setNewMessageCount(totalCount > lastSeen ? totalCount - lastSeen : 0);
    } catch (e) {}
  }

  function handleRoomClick() {
    setNewMessageCount(0);
  }

  const username = userInfo?.username;
  const id = userInfo?.id;
  const profilePhoto = userInfo?.profilePhoto;
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const isRoom = location.pathname === "/room";

  // Show home button only when nav visible AND not typing
  const showHomeBtn = navVisible && !isTyping;

  return (
    <>
      {/* ===== HEADER - fixed at top ===== */}
      <motion.header
        className={styles.header}
        animate={{ y: navVisible ? 0 : -70, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* LOGO - just text, no link */}
       <img 
           src="/enchwra-logo.svg" 
           alt="Enchwra" 
           className={styles.logoImg} 
         />

        <nav className={styles.nav}>
          <Link to="/blog" className={`${styles.navBtn} ${location.pathname === "/blog" ? styles.navBtnActive : ""}`} title="Blog">📑</Link>
          <Link to="/entertainment" className={`${styles.navBtn} ${location.pathname === "/entertainment" ? styles.navBtnActive : ""}`} title="Entertainment">🎬</Link>
          <Link to="/education" className={`${styles.navBtn} ${location.pathname === "/education" ? styles.navBtnActive : ""}`} title="Education">📚</Link>
          <Link to="/" className={styles.navBtn} title="Search">
  🔍
</Link>
          {/* Room with badge */}
          <Link
            to="/room"
            className={`${styles.navBtn} ${location.pathname === "/room" ? styles.navBtnActive : ""}`}
            onClick={handleRoomClick}
            title="Room"
            style={{ position: "relative" }}
          >
            🏪
            {newMessageCount > 0 && (
              <span className={styles.notificationBadge}>
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </span>
            )}
          </Link>

          {/* Logged in */}
          {username && (
            <Link to={`/profile/${id}`} className={styles.profileLink} title={username}>
              {profilePhoto ? (
                <img
                  src={`${apiUrl}/${profilePhoto}`}
                  alt={username}
                  className={styles.profileAvatar}
                />
              ) : (
                <div className={styles.profileAvatarPlaceholder}>
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          )}

          {/* Logged out */}
          {!username && (
            <>
              <Link to="/register" className={styles.navBtn} title="Register">👤</Link>
              <Link to="/login" className={styles.loginBtn}>Sign In</Link>
            </>
          )}
        </nav>
      </motion.header>

      {/* ===== FLOATING HOME BUTTON ===== */}
      <AnimatePresence>
        {showHomeBtn && (
          <motion.button
            className={`${styles.homeBtn} ${isRoom ? styles.homeBtnRoom : ""}`}
            onClick={() => navigate("/")}
            title="Home"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            whileTap={{ scale: 0.88 }}
          >
            🏠
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
