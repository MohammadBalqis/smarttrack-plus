// client/src/pages/auth/CompanyRegister.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitCompanyApplicationApi } from "../../api/companyRegisterApi";
import styles from "../../styles/auth/companyRegister.module.css";

const CompanyRegister = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    businessCategory: "restaurant",
    businessCategoryOther: "",
    commercialRegistrationNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!document) return setError("Please upload 1 official document.");
    if (
      !form.companyName ||
      !form.ownerName ||
      !form.email ||
      !form.password ||
      !form.commercialRegistrationNumber
    ) {
      return setError("Please fill all required fields.");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    if (form.businessCategory === "other" && !form.businessCategoryOther) {
      return setError("Please specify your business category.");
    }

    try {
      setLoading(true);

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== "confirmPassword") fd.append(k, v);
      });
      fd.append("document", document);

      const res = await submitCompanyApplicationApi(fd);
      setSuccess(res.data?.message || "Application submitted.");

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.response?.data?.error || "Submission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Company Registration</h1>
          <p className={styles.subtitle}>
            Submit your company details. Login is allowed only after approval.
          </p>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {success && <div className={styles.alertSuccess}>{success}</div>}

        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>Company Name *</label>
              <input name="companyName" value={form.companyName} onChange={onChange} />
            </div>

            <div className={styles.field}>
              <label>Owner Name *</label>
              <input name="ownerName" value={form.ownerName} onChange={onChange} />
            </div>

            <div className={styles.field}>
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={onChange} />
            </div>

            <div className={styles.field}>
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} />
            </div>

            <div className={styles.fieldFull}>
              <label>Address</label>
              <input name="address" value={form.address} onChange={onChange} />
            </div>

            <div className={styles.field}>
              <label>Business Category</label>
              <select
                name="businessCategory"
                value={form.businessCategory}
                onChange={onChange}
              >
                <option value="restaurant">Restaurant</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="market">Market</option>
                <option value="electronics">Electronics</option>
                <option value="courier">Courier</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* 👇 SHOW ONLY IF OTHER */}
            {form.businessCategory === "other" && (
              <div className={styles.field}>
                <label>Specify Category *</label>
                <input
                  name="businessCategoryOther"
                  value={form.businessCategoryOther}
                  onChange={onChange}
                  placeholder="e.g. Laundry, Printing, Services..."
                />
              </div>
            )}

            <div className={styles.field}>
              <label>Commercial Registration No *</label>
              <input
                name="commercialRegistrationNumber"
                value={form.commercialRegistrationNumber}
                onChange={onChange}
              />
            </div>

            <div className={styles.field}>
              <label>Password *</label>
              <input type="password" name="password" value={form.password} onChange={onChange} />
            </div>

            <div className={styles.field}>
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
              />
            </div>

            <div className={styles.fieldFull}>
              <label>Official Document *</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setDocument(e.target.files?.[0] || null)}
              />
              {document && <span className={styles.fileName}>{document.name}</span>}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate("/login")}
            >
              Back
            </button>

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegister;
