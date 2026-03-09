import { useState } from "react";
import { useNavigate } from "react-router-dom"; // ← useNavigate instead of Navigate

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // ← new state
  const [error, setError] = useState(""); // ← to show error message
  const navigate = useNavigate(); // ← cleaner redirect

  async function register(e) {
    e.preventDefault();

    // Check if passwords match BEFORE sending to backend
    if (password !== confirmPassword) {
      setError("Passwords do not match!"); // show error
      return; // stop here, don't submit
    }

    const response = await fetch("http://localhost:4000/api/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.status === 200) {
      alert("Registration successful!");
      navigate("/login"); // ← useNavigate instead of Navigate component
    } else {
      alert("Registration failed");
    }
  }

  return (
    <form className="form" onSubmit={register}>
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

      {/* New confirm password field */}
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {/* Show error message if passwords don't match */}
      {error && <p style={{color: "red"}}>{error}</p>}

      <button type="submit">Register</button>
    </form>
  );
}