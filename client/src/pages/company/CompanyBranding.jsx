import React, { useEffect, useState } from "react";
import { getBrandingApi, updateBrandingApi } from "../../api/brandingApi";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/company/companyBranding.module.css";

const CompanyBranding = () => {
  const { branding, updateBranding } = useBranding();
  const [form, setForm] = useState(branding);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
    try {
      const res = await getBrandingApi();
      setForm(res.data.branding);
      updateBranding(res.data.branding);
    } catch (err) {
      console.error("Branding load failed:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updateBrandingApi(form);
      updateBranding(res.data.branding);
    } catch (err) {
      console.error("Error updating branding:", err);
    }
    setSaving(false);
  };

  return (
    <div className={styles.page}>
      <h1>Branding Settings</h1>

      {loading ? <p>Loading branding...</p> : null}

      <div className={styles.formCard}>
        <label>Company Display Name</label>
        <input
          value={form.companyDisplayName || ""}
          onChange={(e) =>
            setForm({ ...form, companyDisplayName: e.target.value })
          }
        />

        <label>Short Tagline</label>
        <input
          value={form.shortTagline || ""}
          onChange={(e) => setForm({ ...form, shortTagline: e.target.value })}
        />

        <label>Primary Color</label>
        <input
          type="color"
          value={form.primaryColor}
          onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
        />

        <label>Accent Color</label>
        <input
          type="color"
          value={form.accentColor}
          onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
        />

        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className={styles.previewSection}>
        <h2>Live Theme Preview</h2>

        <div
          className={styles.previewBlock}
          style={{ background: form.primaryColor }}
        >
          Primary Color Example
        </div>

        <div
          className={styles.previewBlock}
          style={{ background: form.accentColor }}
        >
          Accent Color Example
        </div>
      </div>
    </div>
  );
};

export default CompanyBranding;
