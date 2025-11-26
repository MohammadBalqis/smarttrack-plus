// client/src/pages/company/CompanyBranding.jsx
import React, { useEffect, useState } from "react";

import {
  getCompanyBrandingApi,
  updateCompanyBrandingApi,
} from "../../api/companyBrandingApi";

import styles from "../../styles/company/companyBranding.module.css";

const CompanyBranding = () => {
  const [form, setForm] = useState({
    companyDisplayName: "",
    shortTagline: "",
    logoUrl: "",
    coverUrl: "",
    primaryColor: "#1F2933",
    secondaryColor: "#F5F5F5",
    accentColor: "#2563EB",
    about: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    addressLine: "",
    city: "",
    country: "",
    facebookUrl: "",
    instagramUrl: "",
    tiktokUrl: "",
    whatsappNumber: "",
    isPublic: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* -----------------------------------------
     LOAD BRANDING
  ------------------------------------------ */
  const loadBranding = async () => {
    try {
      setLoading(true);
      const res = await getCompanyBrandingApi();
      setForm((prev) => ({ ...prev, ...res.data.branding }));
    } catch (err) {
      console.error("Branding load error:", err);
      setError("Failed to load branding.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranding();
  }, []);

  /* -----------------------------------------
     UPDATE FORM FIELDS
  ------------------------------------------ */
  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* -----------------------------------------
     SAVE BRANDING
  ------------------------------------------ */
  const saveBranding = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const res = await updateCompanyBrandingApi(form);

      setMessage("Branding updated successfully.");
    } catch (err) {
      console.error("Branding save error:", err);
      setError("Failed to save branding.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;

  return (
    <div className={styles.page}>
      <h1>Company Branding</h1>
      <p className={styles.subtitle}>
        Configure your company visual identity & public profile.
      </p>

      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.success}>{message}</p>}

      <div className={styles.grid}>
        {/* ====================================
            LEFT — FORM
        ==================================== */}
        <div className={styles.formSection}>
          <h2>Brand Identity</h2>

          <label>
            Company Display Name
            <input
              type="text"
              value={form.companyDisplayName}
              onChange={(e) => updateField("companyDisplayName", e.target.value)}
            />
          </label>

          <label>
            Short Tagline
            <input
              type="text"
              value={form.shortTagline}
              onChange={(e) => updateField("shortTagline", e.target.value)}
            />
          </label>

          <label>
            Logo URL
            <input
              type="text"
              value={form.logoUrl}
              onChange={(e) => updateField("logoUrl", e.target.value)}
            />
          </label>

          <label>
            Cover Image URL
            <input
              type="text"
              value={form.coverUrl}
              onChange={(e) => updateField("coverUrl", e.target.value)}
            />
          </label>

          <h3>Theme Colors</h3>
          <div className={styles.colorRow}>
            <label>
              Primary Color
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => updateField("primaryColor", e.target.value)}
              />
            </label>
            <label>
              Secondary
              <input
                type="color"
                value={form.secondaryColor}
                onChange={(e) => updateField("secondaryColor", e.target.value)}
              />
            </label>
            <label>
              Accent
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => updateField("accentColor", e.target.value)}
              />
            </label>
          </div>

          <label>
            About
            <textarea
              value={form.about}
              onChange={(e) => updateField("about", e.target.value)}
            />
          </label>

          <h3>Contact Information</h3>
          <label>
            Email
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => updateField("contactEmail", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              type="text"
              value={form.contactPhone}
              onChange={(e) => updateField("contactPhone", e.target.value)}
            />
          </label>
          <label>
            Website
            <input
              type="text"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
            />
          </label>

          <h3>Location</h3>
          <label>
            Address
            <input
              type="text"
              value={form.addressLine}
              onChange={(e) => updateField("addressLine", e.target.value)}
            />
          </label>
          <label>
            City
            <input
              type="text"
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </label>
          <label>
            Country
            <input
              type="text"
              value={form.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
          </label>

          <h3>Social Media</h3>
          <label>
            Facebook
            <input
              type="text"
              value={form.facebookUrl}
              onChange={(e) => updateField("facebookUrl", e.target.value)}
            />
          </label>
          <label>
            Instagram
            <input
              type="text"
              value={form.instagramUrl}
              onChange={(e) => updateField("instagramUrl", e.target.value)}
            />
          </label>
          <label>
            TikTok
            <input
              type="text"
              value={form.tiktokUrl}
              onChange={(e) => updateField("tiktokUrl", e.target.value)}
            />
          </label>
          <label>
            WhatsApp Number
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => updateField("whatsappNumber", e.target.value)}
            />
          </label>

          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => updateField("isPublic", e.target.checked)}
            />
            Public Profile
          </label>

          <button
            disabled={saving}
            onClick={saveBranding}
            className={styles.saveBtn}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* ====================================
            RIGHT — LIVE PREVIEW
        ==================================== */}
        <div className={styles.previewSection}>
          <h2>Live Preview</h2>

          <div
            className={styles.previewCard}
            style={{ borderColor: form.accentColor }}
          >
            {form.coverUrl && (
              <div
                className={styles.cover}
                style={{ backgroundImage: `url(${form.coverUrl})` }}
              />
            )}

            <div className={styles.previewContent}>
              {form.logoUrl && (
                <img src={form.logoUrl} alt="Logo" className={styles.previewLogo} />
              )}

              <h3 style={{ color: form.primaryColor }}>
                {form.companyDisplayName || "Company Name"}
              </h3>

              <p style={{ color: form.accentColor }}>
                {form.shortTagline || "Your company tagline"}
              </p>

              <p className={styles.aboutPreview}>{form.about}</p>

              {form.contactEmail && <p>📧 {form.contactEmail}</p>}
              {form.contactPhone && <p>📞 {form.contactPhone}</p>}
              {form.website && <p>🌐 {form.website}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyBranding;
