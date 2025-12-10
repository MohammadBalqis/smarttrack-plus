import React, { useEffect, useState } from "react";
import { getDriverProfileApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverProfile.module.css";

const DriverProfile = () => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================
     Load driver profile
  ========================================== */
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getDriverProfileApi();
      setDriver(res.data?.driver || null);
    } catch (err) {
      console.error("Error loading driver profile:", err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return d.toLocaleString();
  };

  if (loading) return <div className={styles.page}>Loading profile...</div>;
  if (error) return <div className={styles.page}>{error}</div>;
  if (!driver) return <div className={styles.page}>No profile found</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>
      <p className={styles.subtitle}>
        Your account details. Contact your manager for any changes.
      </p>

      <div className={styles.card}>
        {/* ==============================
            BASIC INFO
        =============================== */}
        <div className={styles.sectionHeader}>Basic Information</div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Name:</span>
          <span className={styles.value}>{driver.name}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Email:</span>
          <span className={styles.value}>{driver.email}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Phone:</span>
          <span className={styles.value}>{driver.phone}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Status:</span>
          <span className={styles.value}>
            {driver.status === "online" ? "🟢 Online" : "⚫ Offline"}
          </span>
        </div>

        {/* ==============================
            COMPANY INFO
        =============================== */}
        <div className={styles.sectionHeader}>Company</div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Company Name:</span>
          <span className={styles.value}>
            {driver.companyId?.name || "—"}
          </span>
        </div>

        {/* ==============================
            VEHICLE INFO
        =============================== */}
        <div className={styles.sectionHeader}>Assigned Vehicle</div>

        {driver.vehicleId ? (
          <>
            <div className={styles.infoRow}>
              <span className={styles.label}>Brand:</span>
              <span className={styles.value}>{driver.vehicleId.brand}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Model:</span>
              <span className={styles.value}>{driver.vehicleId.model}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.label}>Plate Number:</span>
              <span className={styles.value}>
                {driver.vehicleId.plateNumber}
              </span>
            </div>
          </>
        ) : (
          <p className={styles.muted}>No assigned vehicle</p>
        )}

        {/* ==============================
            DOCUMENTS
        =============================== */}
        <div className={styles.sectionHeader}>Documents</div>

        {driver.documents?.length > 0 ? (
          <div className={styles.docsList}>
            {driver.documents.map((doc, idx) => (
              <div key={idx} className={styles.docItem}>
                <span>{doc.type}</span>
                <a href={doc.url} target="_blank" rel="noreferrer">
                  View
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.muted}>No documents uploaded</p>
        )}

        {/* ==============================
            SYSTEM INFO
        =============================== */}
        <div className={styles.sectionHeader}>System Information</div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Created:</span>
          <span className={styles.value}>{formatDate(driver.createdAt)}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Last Login:</span>
          <span className={styles.value}>{formatDate(driver.lastLogin)}</span>
        </div>

        {/* REQUEST UPDATE */}
        <button className={styles.requestBtn}>
          Request Profile Update
        </button>
      </div>
    </div>
  );
};

export default DriverProfile;
