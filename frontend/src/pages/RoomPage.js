 import { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../UserContext";
import { formatISO9075 } from "date-fns";

export default function RoomPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { userInfo } = useContext(UserContext);
  const bottomRef = useRef(null);

  useEffect(() => {
    // Only fetch messages if user is logged in
    if (!userInfo?.id) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [userInfo]); // re-run when userInfo changes (login/logout)

  // Auto scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    const res = await fetch("http://localhost:4000/api/room");
    const data = await res.json();
    setMessages(data);

    if (data.length > 0) {
      localStorage.setItem("lastSeenMessageCount", data.length.toString());
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const res = await fetch("http://localhost:4000/api/room", {
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

    const res = await fetch(`http://localhost:4000/api/room/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (res.ok) {
      setMessages(messages.filter((m) => m._id !== id));
    }
  }

  return (
    <div className="room-page">

      {/* ROOM HEADER */}
      <div className="room-header">
        <h2>🪨 Enchwra Community Room</h2>
        <p>Where the Adara people come together</p>
      </div>

      {/* NOT LOGGED IN — show login prompt, hide everything else */}
      {!userInfo?.id ? (
        <div className="room-login-prompt">
          <p>🪨 Join the conversation!</p>
          <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "15px" }}>
            Login or register to view and send messages
          </p>
          <div className="login-required-buttons">
            <Link to="/login" className="create-btn">Login</Link>
            <Link to="/register" className="create-btn entertainment">
              Register
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* MESSAGES — only visible to logged in users */}
          <div className="messages-container">
            {messages.length === 0 && (
              <p className="no-messages">
                No messages yet. Be the first to say something! 😊
              </p>
            )}

            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`message-bubble ${
                  userInfo?.username === msg.username ? "own-message" : ""
                }`}
              >
                {/* Username */}
                <div className="message-username">
                  <Link to={`/profile/${msg.author}`}>
                    👤 {msg.username}
                  </Link>
                  {/* Delete button - only own messages */}
                  {userInfo?.username === msg.username && (
                    <button
                      className="delete-message-btn"
                      onClick={() => handleDelete(msg._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Message content */}
                <div className="message-content">{msg.content}</div>

                {/* Time */}
                <div className="message-time">
                  {formatISO9075(new Date(msg.createdAt))}
                </div>
              </div>
            ))}

            {/* Scroll anchor */}
            <div ref={bottomRef} />
          </div>

          {/* MESSAGE INPUT */}
          <form className="message-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Say something to the community..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}
    </div>
  );
}
