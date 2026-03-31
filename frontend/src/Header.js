import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
// --- NEW ICON IMPORTS ---
import { 
  Newspaper, 
  Clapperboard, 
  LibraryBig, 
  Search, 
  Store, 
  UserPlus, 
  Home 
} from "lucide-react";
import { UserContext } from "./UserContext";
import styles from "./styles/Header.module.css";

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [navVisible, setNavVisible] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Icon configuration
  const iconSize = 22;

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/profile`, {
          credentials: "include",
        });
        const data = await response.json();
        setUserInfo(data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, [setUserInfo]);

  // 2. Message Polling
  useEffect(() => {
    checkNewMessages();
    const interval = setInterval(checkNewMessages, 10000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // 3. Scroll Logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // 4. Custom Events
  useEffect(() => {
    const hideBtn = () => setNavVisible(false);
    const showBtn = () => setNavVisible(true);
    window.addEventListener("hideHomeBtn", hideBtn);
    window.addEventListener("showHomeBtn", showBtn);
    return () => {
      window.removeEventListener("hideHomeBtn", hideBtn);
      window.removeEventListener("showHomeBtn", showBtn);
    };
  }, []);

  // 5. Input Focus Detection
  useEffect(() => {
    const handleFocusIn = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") {
        setIsTyping(true);
      }
    };
    const handleFocusOut = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") {
        setTimeout(() => setIsTyping(false), 300);
      }
    };
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
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room/count`);
      const data = await res.json();
      const lastSeen = parseInt(localStorage.getItem("lastSeenMessageCount") || "0");
      setNewMessageCount(data.count > lastSeen ? data.count - lastSeen : 0);
    } catch (e) {}
  }

  const handleRoomClick = () => setNewMessageCount(0);

  const { username, id, profilePhoto } = userInfo || {};
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";
  const isRoom = location.pathname === "/room";
  const showHomeBtn = navVisible && !isTyping;

  return (
    <>
      <motion.header
        className={styles.header}
        animate={{ y: navVisible ? 0 : -70, opacity: navVisible ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <img src="/enchwra-logo.png" alt="Enchwra" className={styles.logoImg} />

        <nav className={styles.nav}>
          <Link to="/blog" className={`${styles.navBtn} ${location.pathname === "/blog" ? styles.navBtnActive : ""}`} title="Blog">
            <Newspaper size={iconSize} />
          </Link>
          <Link to="/entertainment" className={`${styles.navBtn} ${location.pathname === "/entertainment" ? styles.navBtnActive : ""}`} title="Entertainment">
            <Clapperboard size={iconSize} />
          </Link>
          <Link to="/education" className={`${styles.navBtn} ${location.pathname === "/education" ? styles.navBtnActive : ""}`} title="Education">
            <LibraryBig size={iconSize} />
          </Link>
          <Link to="/" className={styles.navBtn} title="Search">
            <Search size={iconSize} />
          </Link>
          <Link
            to="/room"
            className={`${styles.navBtn} ${location.pathname === "/room" ? styles.navBtnActive : ""}`}
            onClick={handleRoomClick}
            title="Room"
            style={{ position: "relative" }}
          >
            <Store size={iconSize} />
            {newMessageCount > 0 && (
              <span className={styles.notificationBadge}>
                {newMessageCount > 99 ? "99+" : newMessageCount}
              </span>
            )}
          </Link>

          {username ? (
            <Link to={`/profile/${id}`} className={styles.profileLink} title={username}>
              {profilePhoto ? (
                <img src={`${apiUrl}/${profilePhoto}`} alt={username} className={styles.profileAvatar} />
              ) : (
                <div className={styles.profileAvatarPlaceholder}>{username.charAt(0).toUpperCase()}</div>
              )}
            </Link>
          ) : (
            <>
              <Link to="/register" className={styles.navBtn} title="Register">
                <UserPlus size={iconSize} />
              </Link>
              <Link to="/login" className={styles.loginBtn}>Sign In</Link>
            </>
          )}
        </nav>
      </motion.header>

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
            <Home size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
 