import { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { useModal } from "../ModalContext";
import { formatISO9075 } from "date-fns";
import styles from "../styles/RoomPage.module.css";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function RoomPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { userInfo } = useContext(UserContext);
  const { showError, showConfirm } = useModal();
  const messagesRef = useRef(null);    // the scrolling message list
  const inputRef = useRef(null);       // the auto-growing message box
  const lastCountRef = useRef(0);     // how many messages we have already scrolled for
  const fetchErrorShownRef = useRef(false); // so a lost connection shows ONE modal, not one every 5 seconds

  useEffect(() => {
    if (!userInfo?.id) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userInfo]);

  // Scroll the message LIST (not the whole page) to the bottom, and only when
  // new messages arrive.
  useEffect(() => {
    const list = messagesRef.current;
    if (!list) return;
    if (messages.length > lastCountRef.current) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
    lastCountRef.current = messages.length;
  }, [messages]);

  // Grow the message box with its text. CSS max-height caps it; past that
  // the box scrolls. Runs on every change, including clearing after send.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [newMessage, userInfo]);

  // Enter sends, Shift+Enter adds a new line
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend(e);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`${apiUrl}/api/room`);
      if (!res.ok) throw new Error("Bad response");
      const data = await res.json();
      fetchErrorShownRef.current = false;
      setMessages(data);
      if (data.length > 0) {
        localStorage.setItem("lastSeenMessageCount", data.length.toString());
      }
    } catch {
      if (!fetchErrorShownRef.current) {
        fetchErrorShownRef.current = true;
        showError("Could not load messages. Check your connection.");
      }
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`${apiUrl}/api/room`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
      } else {
        showError("Your message could not be sent. Please try again.");
      }
    } catch {
      showError("Your message could not be sent. Check your connection.");
    }
  }

  async function handleDelete(id) {
    const confirmed = await showConfirm("Delete this message?", {
      title: "Delete message",
      confirmText: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    try {
      const res = await fetch(`${apiUrl}/api/room/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
      } else {
        showError("Could not delete the message. Please try again.");
      }
    } catch {
      showError("Could not delete the message. Check your connection.");
    }
  }

  // Hide home button when input is focused
  // Show it again when input is blurred
  function handleInputFocus() {
    window.dispatchEvent(new CustomEvent("hideHomeBtn"));
  }

  function handleInputBlur() {
    window.dispatchEvent(new CustomEvent("showHomeBtn"));
  }

  return (
    <div className={styles.roomPage}>

      {/* ROOM HEADER */}
      <div className={styles.roomHeader}>
        <h2>🪨 Enchwra Community Room</h2>
        <p>Where the Adara people come together</p>
      </div>

      {/* NOT LOGGED IN */}
      {!userInfo?.id ? (
        <div className={styles.roomLoginPrompt}>
          <p>🪨 Join the conversation!</p>
          <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "15px" }}>
            Login or register to view and send messages
          </p>
          <div className="login-required-buttons">
            <Link to="/login" className="create-btn">Login</Link>
            <Link to="/register" className="create-btn entertainment">Register</Link>
          </div>
        </div>
      ) : (
        <>
          {/* MESSAGES */}
          <div className={styles.messagesContainer} ref={messagesRef}>
            {messages.length === 0 && (
              <p className={styles.noMessages}>
                No messages yet. Be the first to say something! 😊
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`${styles.messageBubble} ${
                  userInfo?.username === msg.username ? styles.ownMessage : ""
                }`}
              >
                <div className={styles.messageUsername}>
                  <Link to={`/profile/${msg.author}`}>
                    👤 {msg.username}
                  </Link>
                  {userInfo?.username === msg.username && (
                    <button
                      className={styles.deleteMessageBtn}
                      onClick={() => handleDelete(msg._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                <div className={styles.messageContent}>{msg.content}</div>

                <div className={styles.messageTime}>
                  {formatISO9075(new Date(msg.createdAt))}
                </div>
              </div>
            ))}
          </div>

          {/* MESSAGE INPUT - hides home button on focus */}
          <form className={styles.messageForm} onSubmit={handleSend}>
            <textarea
              ref={inputRef}
              rows={1}
              placeholder="Say something to the community..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
}
