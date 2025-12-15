import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerCustomerApi } from "../../api/authApi";

import styles from "../../styles/auth/login.module.css"; // reuse login style

const RegisterCustomer = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    address: "",
    profileImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({ ...form, [name]: files ? files[0] : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        data.append(key, value)
      );

      const res = await registerCustomerApi(data);

      localStorage.setItem("token", res.data.token);
      navigate("/customer", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.cardWrapper}>
        {/* LEFT PANEL (REUSED BRANDING) */}
        <div className={styles.leftPanel}>
          <div className={styles.logoBox}>
            <div className={styles.logoCircle}>S+</div>
            <div>
              <div className={styles.logoTitle}>SmartTrack+</div>
              <div className={styles.logoSubtitle}>Delivery Ecosystem</div>
            </div>
          </div>

          <h1 className={styles.leftTitle}>
            Customer <span className={styles.highlight}>Registration</span>
          </h1>

          <p className={styles.leftText}>
            Track your orders, follow drivers live, and manage deliveries easily.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create Customer Account</h2>
            <p className={styles.formSubtitle}>
              Register using your phone number
            </p>
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input
                className={styles.input}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+961 70 123 456"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Address</label>
              <textarea
                className={styles.input}
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Profile Image</label>
              <input
                className={styles.input}
                type="file"
                name="profileImage"
                accept="image/*"
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className={styles.registerBox}>
            <button
              className={styles.secondaryGhostBtn}
              onClick={() => navigate("/login")}
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomer;
