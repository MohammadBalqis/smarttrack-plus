import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axiosConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/company";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Adjust URL to match your backend
      const res = await api.post("/auth/login", { email, password });

      const { token, user } = res.data; // Ensure your backend returns these
      login(token, user);

      // Redirect based on role
      if (user.role === "superadmin") navigate("/admin");
      else if (user.role === "company") navigate("/company");
      else if (user.role === "manager") navigate("/manager");
      else if (user.role === "customer") navigate("/customer");
      else navigate(from);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Login failed. Please check credentials."
      );
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ background: "white", padding: 24, borderRadius: 12, width: "100%", maxWidth: 360 }}>
        <h1 style={{ marginBottom: 16 }}>SmartTrack+ Login</h1>
        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: 8,
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginTop: 4,
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                marginTop: 4,
              }}
              required
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              background: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: 999,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
