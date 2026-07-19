import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import styles from "../styles/Auth.module.css";
import Spinner from "../Spinner";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  async function register(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/register`,
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
      }
    );

    if (response.status === 200) {
      // Trigger vanish animation then navigate
      wrapperRef.current?.classList.add(styles.vanish);
      setTimeout(() => {
        navigate("/login");
      }, 450);
    } else {
      setIsSubmitting(false);
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Registration failed. Username may already exist.");
    }
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

          <p className={styles.authTitle}>Join the community</p>

          <form onSubmit={register}>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className={styles.authError}>{error}</p>}

            <button
              type="submit"
              className={styles.authBtn}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Creating account..." : "Create Account"}</span>
            </button>
          </form>

          <p className={styles.authFooter}>
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
