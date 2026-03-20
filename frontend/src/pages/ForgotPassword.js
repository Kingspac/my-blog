import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import styles from "../styles/Auth.module.css";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    // For now show a message — full email recovery needs email field in User model
    setSubmitted(true);
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.formWrapper} ref={wrapperRef}>

        {/* Rotating border */}
        <div className={styles.borderRotator}></div>

        {/* Form card */}
        <div className={styles.authForm}>

          {/* Logo */}
          <div className={styles.authLogo}>
            <h1>🪨 Enchwra</h1>
            <p>Voice of the Adara People</p>
          </div>

          {!submitted ? (
            <>
              <p className={styles.authTitle}>Recover your account</p>

              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

                {error && <p className={styles.authError}>{error}</p>}

                <button type="submit" className={styles.authBtn}>
                  <span>Send Recovery Link</span>
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✉️</p>
              <p style={{ color: "#e8d5b7", fontFamily: "DM Sans, sans-serif", marginBottom: "8px" }}>
                If <strong style={{ color: "#CD853F" }}>{username}</strong> exists,
                a recovery email has been sent.
              </p>
              <p style={{ color: "#7a5c3a", fontSize: "0.85rem", fontFamily: "DM Sans, sans-serif" }}>
                Check your registered email address.
              </p>
            </div>
          )}

          <p className={styles.authFooter}>
            Remember your password?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
