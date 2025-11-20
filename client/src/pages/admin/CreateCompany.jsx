import React, { useState } from "react";
import { createCompanyApi } from "../../api/adminApi";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/admin/adminDashboard.module.css";

const CreateCompany = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await createCompanyApi(form);
      navigate("/admin/companies");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create company");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create New Company</h2>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.formCard}>
        <label>Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button className={styles.primaryBtn} disabled={saving}>
          {saving ? "Creating..." : "Create Company"}
        </button>
      </form>
    </div>
  );
};

export default CreateCompany;
