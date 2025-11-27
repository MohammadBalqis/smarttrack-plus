// client/src/pages/company/CompanyProfile.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyProfileApi,
  updateCompanyProfileApi,
  updateCompanyPasswordApi,
  updateCompanyPreferencesApi,
} from "../../api/companySettingsApi";

import styles from "../../styles/company/companyProfile.module.css";

const CompanyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [prefsError, setPrefsError] = useState("");

  // ============================
  // PROFILE FORM STATE
  // ============================
  const [profile, setProfile] = useState({
    companyName: "",
    companyDisplayName: "",
    legalName: "",
    email: "",
    phoneNumber: "",
    website: "",
    country: "",
    city: "",
    addressLine: "",
    registrationNumber: "",
    taxNumber: "",
    contactPersonName: "",
    contactPersonPhone: "",
    industry: "",
  });

  // ============================
  // PASSWORD FORM STATE
  // ============================
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ============================
  // PREFERENCES FORM STATE
  // ============================
  const [prefs, setPrefs] = useState({
    notificationsEmail: true,
    notificationsSms: false,
    notificationsPush: true,
    dailySummaryEmail: false,
    language: "en",
    timezone: "Asia/Beirut",
  });

  // ============================
  // LOAD INITIAL DATA
  // ============================
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await getCompanyProfileApi();

        const p = res.data?.profile || {};
        const pr = res.data?.preferences || {};

        setProfile({
          companyName: p.companyName || "",
          companyDisplayName: p.companyDisplayName || "",
          legalName: p.legalName || "",
          email: p.email || "",
          phoneNumber: p.phoneNumber || "",
          website: p.website || "",
          country: p.country || "",
          city: p.city || "",
          addressLine: p.addressLine || "",
          registrationNumber: p.registrationNumber || "",
          taxNumber: p.taxNumber || "",
          contactPersonName: p.contactPersonName || "",
          contactPersonPhone: p.contactPersonPhone || "",
          industry: p.industry || "",
        });

        setPrefs({
          notificationsEmail: pr.notificationsEmail ?? true,
          notificationsSms: pr.notificationsSms ?? false,
          notificationsPush: pr.notificationsPush ?? true,
          dailySummaryEmail: pr.dailySummaryEmail ?? false,
          language: pr.language || "en",
          timezone: pr.timezone || "Asia/Beirut",
        });
      } catch (err) {
        console.error("Company profile load error:", err);
        setError(
          err?.response?.data?.error || "Failed to load company profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ============================
  // HANDLERS
  // ============================
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrefsChange = (e) => {
    const { name, type, checked, value } = e.target;
    setPrefs((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================
  // SAVE PROFILE
  // ============================
  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setError("");

    try {
      const res = await updateCompanyProfileApi(profile);
      const p = res.data?.profile || {};

      setProfile((prev) => ({
        ...prev,
        companyName: p.companyName || prev.companyName,
        companyDisplayName: p.companyDisplayName || prev.companyDisplayName,
        legalName: p.legalName || prev.legalName,
        email: p.email || prev.email,
        phoneNumber: p.phoneNumber || prev.phoneNumber,
        website: p.website || prev.website,
        country: p.country || prev.country,
        city: p.city || prev.city,
        addressLine: p.addressLine || prev.addressLine,
        registrationNumber: p.registrationNumber || prev.registrationNumber,
        taxNumber: p.taxNumber || prev.taxNumber,
        contactPersonName: p.contactPersonName || prev.contactPersonName,
        contactPersonPhone: p.contactPersonPhone || prev.contactPersonPhone,
        industry: p.industry || prev.industry,
      }));

      alert("Company profile updated successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      setError(
        err?.response?.data?.error || "Failed to update company profile."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================
  // SAVE PASSWORD
  // ============================
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
      await updateCompanyPasswordApi(passwordForm);
      alert("Password updated successfully!");

      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Password update error:", err);
      setPasswordError(
        err?.response?.data?.error || "Failed to update password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // ============================
  // SAVE PREFERENCES
  // ============================
  const savePreferences = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsError("");

    try {
      await updateCompanyPreferencesApi(prefs);
      alert("Preferences updated successfully!");
    } catch (err) {
      console.error("Prefs update error:", err);
      setPrefsError(
        err?.response?.data?.error || "Failed to update preferences."
      );
    } finally {
      setSavingPrefs(false);
    }
  };

  if (loading) {
    return <p className={styles.loading}>Loading company profile…</p>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Company Profile</h1>
      <p className={styles.subtitle}>
        Manage your company information, account security, and notification
        preferences.
      </p>

      {/* =============== COMPANY INFO =============== */}
      <div className={styles.card}>
        <h3>Company Information</h3>
        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={saveProfile} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Company Name *</label>
            <input
              name="companyName"
              value={profile.companyName}
              onChange={handleProfileChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Display Name (shown on dashboards)</label>
            <input
              name="companyDisplayName"
              value={profile.companyDisplayName}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Legal Name</label>
            <input
              name="legalName"
              value={profile.legalName}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Industry / Business Type</label>
            <input
              name="industry"
              value={profile.industry}
              onChange={handleProfileChange}
              placeholder="Delivery, restaurant, supermarket…"
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
            <label>Phone *</label>
            <input
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleProfileChange}
              placeholder="+961…"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Website</label>
            <input
              name="website"
              value={profile.website}
              onChange={handleProfileChange}
              placeholder="https://example.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Country</label>
            <input
              name="country"
              value={profile.country}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>City</label>
            <input
              name="city"
              value={profile.city}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroupFull}>
            <label>Address</label>
            <input
              name="addressLine"
              value={profile.addressLine}
              onChange={handleProfileChange}
              placeholder="Street / building / floor"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Registration Number</label>
            <input
              name="registrationNumber"
              value={profile.registrationNumber}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tax Number</label>
            <input
              name="taxNumber"
              value={profile.taxNumber}
              onChange={handleProfileChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Person Name</label>
            <input
              name="contactPersonName"
              value={profile.contactPersonName}
              onChange={handleProfileChange}
              placeholder="Owner / Manager name"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Contact Person Phone</label>
            <input
              name="contactPersonPhone"
              value={profile.contactPersonPhone}
              onChange={handleProfileChange}
              placeholder="+961…"
            />
          </div>

          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={savingProfile}
            >
              {savingProfile ? "Saving…" : "Save Company Info"}
            </button>
          </div>
        </form>
      </div>

      {/* =============== PASSWORD & SECURITY =============== */}
      <div className={styles.card}>
        <h3>Password & Security</h3>
        {passwordError && <p className={styles.error}>{passwordError}</p>}

        <form onSubmit={savePassword} className={styles.formGridSmall}>
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

          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.secondaryBtn}
              disabled={savingPassword}
            >
              {savingPassword ? "Saving…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* =============== PREFERENCES =============== */}
      <div className={styles.card}>
        <h3>Notification & Preferences</h3>
        {prefsError && <p className={styles.error}>{prefsError}</p>}

        <form onSubmit={savePreferences} className={styles.prefsGrid}>
          <div className={styles.prefsGroup}>
            <h4>Notifications</h4>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="notificationsEmail"
                checked={prefs.notificationsEmail}
                onChange={handlePrefsChange}
              />
              <span>Email notifications</span>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="notificationsSms"
                checked={prefs.notificationsSms}
                onChange={handlePrefsChange}
              />
              <span>SMS notifications</span>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="notificationsPush"
                checked={prefs.notificationsPush}
                onChange={handlePrefsChange}
              />
              <span>In-app notifications</span>
            </label>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="dailySummaryEmail"
                checked={prefs.dailySummaryEmail}
                onChange={handlePrefsChange}
              />
              <span>Daily email summary</span>
            </label>
          </div>

          <div className={styles.prefsGroup}>
            <h4>Localization</h4>

            <label className={styles.formGroup}>
              <span>Interface Language</span>
              <select
                name="language"
                value={prefs.language}
                onChange={handlePrefsChange}
              >
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                {/* add more if needed */}
              </select>
            </label>

            <label className={styles.formGroup}>
              <span>Timezone</span>
              <select
                name="timezone"
                value={prefs.timezone}
                onChange={handlePrefsChange}
              >
                <option value="Asia/Beirut">Asia/Beirut</option>
                <option value="Europe/London">Europe/London</option>
                <option value="UTC">UTC</option>
                {/* you can expand later */}
              </select>
            </label>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={savingPrefs}
            >
              {savingPrefs ? "Saving…" : "Save Preferences"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfile;
