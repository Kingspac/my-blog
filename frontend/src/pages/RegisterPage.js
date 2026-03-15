import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function register(e) {
    e.preventDefault();

    // Check if passwords match BEFORE sending to backend
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:4000"}/api/register`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      alert("Registration successful!");
      navigate("/login");
    } else {
      alert("Registration failed");
    }
  }

  return (
    <form className={styles.authForm} onSubmit={register}>
      <h1>Register</h1>

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

      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {/* Show error if passwords don't match */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <button type="submit">Register</button>
    </form>
  );
}
