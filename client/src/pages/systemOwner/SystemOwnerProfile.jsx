import React, { useEffect, useState } from "react";
import {
  getOwnerProfileApi,
  updateOwnerProfileApi,
  updateOwnerPasswordApi,
} from "../../api/ownerApi";

import styles from "../../styles/systemOwner/systemOwnerProfile.module.css";

const SystemOwnerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* ================= LOAD PROFILE ================= */
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getOwnerProfileApi();
      setProfile(res.data.profile || {});
    } catch (err) {
      console.error(err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  /* ================= UPDATE PROFILE ================= */
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await updateOwnerProfileApi({
        name: profile.name,
        phone: profile.phone,
      });

      if (res.data?.ok) {
        setProfile(res.data.profile);
        setSuccess("Profile updated successfully.");
      } else {
        setError(res.data?.error || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UPDATE PASSWORD ================= */
  const handleSavePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSavingPass(true);
      setError("");
      setSuccess("");

      const res = await updateOwnerPasswordApi({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      if (res.data?.ok) {
        setSuccess("Password updated successfully.");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(res.data?.error || "Password update failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Error updating password.");
    } finally {
      setSavingPass(false);
    }
  };

  if (loading) return <div className={styles.page}>Loading profile...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>
      <p className={styles.subtitle}>
        Manage your account and security settings.
      </p>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <div className={styles.grid}>
        {/* GENERAL INFO */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>General Information</h2>

          <label className={styles.label}>Full Name</label>
          <input
            className={styles.input}
            value={profile.name}
            onChange={(e) =>
              setProfile({ ...profile, name: e.target.value })
            }
          />

          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            value={profile.email}
            disabled
          />

          <label className={styles.label}>Phone</label>
          <input
            className={styles.input}
            value={profile.phone || ""}
            onChange={(e) =>
              setProfile({ ...profile, phone: e.target.value })
            }
          />

          <button
            className={styles.saveBtn}
            disabled={saving}
            onClick={handleSaveProfile}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* PASSWORD */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Change Password</h2>

          <label className={styles.label}>Current Password</label>
          <input
            type="password"
            className={styles.input}
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords({
                ...passwords,
                currentPassword: e.target.value,
              })
            }
          />

          <label className={styles.label}>New Password</label>
          <input
            type="password"
            className={styles.input}
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({
                ...passwords,
                newPassword: e.target.value,
              })
            }
          />

          <label className={styles.label}>Confirm New Password</label>
          <input
            type="password"
            className={styles.input}
            value={passwords.confirmPassword}
            onChange={(e) =>
              setPasswords({
                ...passwords,
                confirmPassword: e.target.value,
              })
            }
          />

          <button
            className={styles.saveBtn}
            disabled={savingPass}
            onClick={handleSavePassword}
          >
            {savingPass ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemOwnerProfile;
