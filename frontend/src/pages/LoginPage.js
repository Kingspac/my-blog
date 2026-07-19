import { useContext, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../UserContext.js";
import styles from "../styles/Auth.module.css";
import Spinner from "../Spinner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUserInfo } = useContext(UserContext);
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  async function login(e) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch(
      `${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/login`,
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (response.ok) {
      // Trigger vanish animation then navigate
      wrapperRef.current?.classList.add(styles.vanish);
      setTimeout(() => {
        response.json().then((userInfo) => {
          setUserInfo(userInfo);
          navigate("/");
        });
      }, 450);
    } else {
      setIsSubmitting(false);
      setError("Wrong username or password. Please try again.");
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

          <p className={styles.authTitle}>Welcome back</p>

          <form onSubmit={login}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>

            {error && <p className={styles.authError}>{error}</p>}

            <button
              type="submit"
              className={styles.authBtn}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
            </button>
          </form>

          <p className={styles.authFooter}>
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
