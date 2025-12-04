// client/src/components/customer/settings/DeleteAccount.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteMyAccountApi } from "../../../api/customerAccountApi";
import { useAuth } from "../../../context/AuthContext";
import styles from "../../../styles/customer/settings.module.css";

const DeleteAccount = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = password && confirmText === "DELETE";

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setLoading(true);
      setError("");

      await deleteMyAccountApi({ password, reason });

      setDone(true);

      // Clear auth & redirect
      logout();
      navigate("/login");
    } catch (err) {
      console.error("Delete account error:", err);
      const msg =
        err.response?.data?.error || "Failed to delete your account. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.deleteBox}>
      <h2 className={styles.deleteTitle}>Danger Zone</h2>
      <p className={styles.deleteWarning}>
        Deleting your account will <strong>log you out from all devices</strong> and
        deactivate your SmartTrack+ profile. This action cannot be undone.
      </p>

      {error && <p className={styles.errorText}>{error}</p>}
      {done && (
        <p className={styles.successText}>
          Your account has been deleted. Redirecting…
        </p>
      )}

      <form onSubmit={handleDelete} className={styles.deleteForm}>
        <label className={styles.label}>
          Confirm your password
          <input
            type="password"
            className={styles.input}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Why are you leaving? <span className={styles.optional}>(optional)</span>
          <textarea
            className={styles.textarea}
            placeholder="Tell us briefly why you want to delete your account…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </label>

        <label className={styles.label}>
          Type <code>DELETE</code> to confirm
          <input
            type="text"
            className={styles.input}
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
          />
        </label>

        <button
          type="submit"
          className={styles.deleteBtn}
          disabled={!canSubmit || loading}
        >
          {loading ? "Deleting…" : "Permanently delete my account"}
        </button>
      </form>
    </div>
  );
};

export default DeleteAccount;
