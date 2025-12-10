// client/src/pages/systemOwner/SystemOwnerSettings.jsx
import React, { useEffect, useState } from "react";
import {
  getOwnerSettingsApi,
  updateOwnerSettingsApi,
} from "../../api/ownerApi";

import styles from "../../styles/systemOwner/systemOwnerSettings.module.css";

const SystemOwnerSettings = () => {
  const [form, setForm] = useState({
    platformName: "",
    supportEmail: "",
    defaultCurrency: "USD",
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getOwnerSettingsApi();
      const s = res.data?.settings || {};

      setForm({
        platformName: s.platformName || "SmartTrack+",
        supportEmail: s.supportEmail || "",
        defaultCurrency: s.defaultCurrency || "USD",
        maintenanceMode: !!s.maintenanceMode,
      });
    } catch (err) {
      console.error("Owner settings load error:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await updateOwnerSettingsApi(form);
      setSuccess("Settings updated successfully.");
    } catch (err) {
      console.error("Owner settings save error:", err);
      const msg =
        err?.response?.data?.error || "Failed to save settings. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Platform Settings</h1>
          <p className={styles.subtitle}>
            Control global options for SmartTrack+: branding, currency, and
            maintenance mode.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={loadSettings}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {success && <div className={styles.successBox}>{success}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.fieldRow}>
          <label className={styles.label} htmlFor="platformName">
            Platform Name
          </label>
          <input
            id="platformName"
            name="platformName"
            type="text"
            value={form.platformName}
            onChange={handleChange}
            className={styles.input}
            placeholder="SmartTrack+"
          />
          <p className={styles.hint}>
            Appears in sidebars, emails, and invoices.
          </p>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.label} htmlFor="supportEmail">
            Support Email
          </label>
          <input
            id="supportEmail"
            name="supportEmail"
            type="email"
            value={form.supportEmail}
            onChange={handleChange}
            className={styles.input}
            placeholder="owner@smarttrackplus.com"
          />
          <p className={styles.hint}>
            Used for system emails and customer/company contact.
          </p>
        </div>

        <div className={styles.fieldRow}>
          <label className={styles.label} htmlFor="defaultCurrency">
            Default Currency
          </label>
          <select
            id="defaultCurrency"
            name="defaultCurrency"
            value={form.defaultCurrency}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="USD">USD – US Dollar</option>
            <option value="LBP">LBP – Lebanese Pound</option>
            <option value="EUR">EUR – Euro</option>
            {/* You can add more later */}
          </select>
          <p className={styles.hint}>
            Used as the base currency for subscription billing.
          </p>
        </div>

        <div className={`${styles.fieldRow} ${styles.checkboxRow}`}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={form.maintenanceMode}
              onChange={handleChange}
            />
            <span>Enable Maintenance Mode</span>
          </label>
          <p className={styles.hint}>
            When enabled, non-owner users may see a maintenance message while
            you perform updates.
          </p>
        </div>

        <div className={styles.actionsRow}>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SystemOwnerSettings;
