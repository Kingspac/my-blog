import { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";
import styles from "../styles/RoomPage.module.css";

export default function RoomPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { userInfo } = useContext(UserContext);
  const messagesRef = useRef(null);    // the scrolling message list
  const inputRef = useRef(null);       // the auto-growing message box
  const lastCountRef = useRef(0);     // how many messages we have already scrolled for

  useEffect(() => {
    if (!userInfo?.id) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userInfo]);

  // Scroll the message LIST (not the whole page) to the bottom, and only when
  // new messages arrive. The old scrollIntoView moved the entire window and
  // also ran on every 5-second refresh, snapping you away from old messages.
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
    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room`);
    const data = await res.json();
    setMessages(data);
    if (data.length > 0) {
      localStorage.setItem("lastSeenMessageCount", data.length.toString());
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newMessage }),
    });

    if (res.ok) {
      const message = await res.json();
      setMessages([...messages, message]);
      setNewMessage("");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Delete this message?");
    if (!confirmed) return;

    const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/room/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setMessages(messages.filter((m) => m._id !== id));
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