// client/src/pages/auth/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/authApi";

import styles from "../../styles/auth/login.module.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState("email"); // email | phone
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ============================
     HANDLE LOGIN TYPE SWITCH ✅
  ============================ */
  const switchLoginType = (type) => {
    setLoginType(type);
    setIdentifier("");   // ✅ reset input
    setError("");        // ✅ clear error
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginApi(
        loginType === "email" ? identifier : null,
        password,
        loginType === "phone" ? identifier : null
      );

      const { token, user, sessionId } = res.data;

      login(token, user, sessionId);

      if (user.role === "superadmin") navigate("/owner", { replace: true });
      else if (user.role === "company") navigate("/company", { replace: true });
      else if (user.role === "manager") navigate("/manager", { replace: true });
      else if (user.role === "driver") navigate("/driver", { replace: true });
      else navigate("/customer", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.cardWrapper}>

        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          <div className={styles.logoBox}>
            <div className={styles.logoCircle}>S+</div>
            <div>
              <div className={styles.logoTitle}>SmartTrack+</div>
              <div className={styles.logoSubtitle}>Delivery Ecosystem</div>
            </div>
          </div>

          <h1 className={styles.leftTitle}>
            One platform for{" "}
            <span className={styles.highlight}>all delivery roles.</span>
          </h1>

          <p className={styles.leftText}>
            Companies, managers, drivers, and customers operate in one secure,
            role-based delivery system.
          </p>

          <ul className={styles.benefitsList}>
            <li>📦 Live order & trip tracking</li>
            <li>👥 Multi-role dashboards</li>
            <li>💳 Subscription-based billing</li>
          </ul>

          <div className={styles.footerNote}>
            Powered by <span>SmartTrack+</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Sign in</h2>
            <p className={styles.formSubtitle}>
              {loginType === "email"
                ? "Use your registered email and password"
                : "Use your phone number and password"}
            </p>
          </div>

          {/* LOGIN TYPE SWITCH */}
          <div className={styles.switchBox}>
            <button
              type="button"
              className={
                loginType === "email"
                  ? styles.switchActive
                  : styles.switchBtn
              }
              onClick={() => switchLoginType("email")}
            >
              Email
            </button>

            <button
              type="button"
              className={
                loginType === "phone"
                  ? styles.switchActive
                  : styles.switchBtn
              }
              onClick={() => switchLoginType("phone")}
            >
              Phone
            </button>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                {loginType === "email" ? "Email" : "Phone Number"}
              </label>

              <input
                type={loginType === "email" ? "email" : "tel"}   
                autoComplete={
                  loginType === "email" ? "email" : "tel"
                }                                              
                className={styles.input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={
                  loginType === "email"
                    ? "you@example.com"
                    : "+961 70 123 456"
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"  /* ✅ */
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* REGISTER LINKS */}
          <div className={styles.registerBox}>
            <p className={styles.registerText}>Don’t have an account?</p>

            <button
              className={styles.secondaryBtn}
              onClick={() => navigate("/register/company")}
            >
              Register your Company
            </button>

            <button
              className={styles.secondaryGhostBtn}
              onClick={() => navigate("/register/customer")}
            >
              Register as Customer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
