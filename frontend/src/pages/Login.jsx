import React, { useState } from "react";

export default function LoginPage({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = async (e, action) => {
    e.preventDefault();
    setError(null);
    try {
      if (action === "login") await onLogin({ email, password });
      else await onRegister({ email, password });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card">
      <h3>Login / Register</h3>
      <form>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@org.com" />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button onClick={(e) => submit(e, "login")}>Login</button>
          <button onClick={(e) => submit(e, "register")} style={{ marginLeft: 8 }}>Register</button>
        </div>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
      <p style={{ marginTop: 8, color: "#666" }}>Note: registration requires an <strong>org.com</strong> email.</p>
    </div>
  );
}
