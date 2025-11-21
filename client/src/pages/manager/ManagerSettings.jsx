import React, { useEffect, useState } from "react";
import {
  getManagerProfileApi,
  updateManagerProfileApi,
  updateManagerPasswordApi,
} from "../../api/managerSettingsApi";

import styles from "../../styles/manager/managerSettings.module.css";

const ManagerSettings = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getManagerProfileApi();
      setProfile({
        name: res.data.user.name,
        email: res.data.user.email,
        phoneNumber: res.data.user.phoneNumber || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // =============================
  // SAVE PROFILE
  // =============================
  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");

    try {
      const res = await updateManagerProfileApi(profile);
      alert("Profile updated successfully!");

      setProfile({
        name: res.data.user.name,
        email: res.data.user.email,
        phoneNumber: res.data.user.phoneNumber || "",
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to update profile. Try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // =============================
  // SAVE PASSWORD
  // =============================
  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      setSavingPassword(false);
      return;
    }

    try {
      const res = await updateManagerPasswordApi(passwordForm);
      alert("Password updated successfully!");

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      setPasswordError(
        err.response?.data?.error || "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.page}>
      <h1>Settings</h1>
      <p className={styles.subtitle}>Manage your profile and account security.</p>

      {/* =============================
          PROFILE SETTINGS
      ============================= */}
      <div className={styles.card}>
        <h3>Profile Information</h3>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={saveProfile} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input
              name="name"
              value={profile.name}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone</label>
            <input
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleProfileChange}
              placeholder="+961..."
            />
          </div>

          <button type="submit" disabled={savingProfile} className={styles.saveBtn}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* =============================
          PASSWORD SETTINGS
      ============================= */}
      <div className={styles.card}>
        <h3>Password & Security</h3>

        {passwordError && <p className={styles.error}>{passwordError}</p>}

        <form onSubmit={savePassword} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Current Password *</label>
            <input
              type="password"
              name="oldPassword"
              value={passwordForm.oldPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>New Password *</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className={styles.saveBtn}
          >
            {savingPassword ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManagerSettings;
