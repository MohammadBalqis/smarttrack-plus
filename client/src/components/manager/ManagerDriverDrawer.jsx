// client/src/components/manager/ManagerDriverDrawer.jsx
import React, { useEffect, useState } from "react";
import { updateManagerDriverApi } from "../../api/managerDriversApi";
import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDriverDrawer = ({ open, onClose, driver, onUpdated }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (driver) {
      setName(driver.name || "");
      setEmail(driver.email || "");
      setPhoneNumber(driver.phoneNumber || driver.phone || "");
    }
  }, [driver]);

  if (!open || !driver) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateManagerDriverApi(driver._id, {
        name,
        email,
        phoneNumber,
      });
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update driver:", err);
      alert("Failed to update driver. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const statusBadgeClass =
    driver.isActive !== false
      ? styles.badgeActive
      : styles.badgeInactive;

  const driverStatusLabel = driver.driverStatus
    ? driver.driverStatus.replace("_", " ")
    : "—";

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2>Driver Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Top info */}
        <div className={styles.driverTop}>
          {driver.profileImage ? (
            <img
              src={driver.profileImage}
              alt={driver.name}
              className={styles.avatarLarge}
            />
          ) : (
            <div className={styles.avatarLargeFallback}>
              {driver.name?.charAt(0) || "D"}
            </div>
          )}

          <div className={styles.driverMainInfo}>
            <div className={styles.driverNameRow}>
              <h3>{driver.name || "Unnamed driver"}</h3>
              <span className={statusBadgeClass}>
                {driver.isActive !== false ? "Active" : "Inactive"}
              </span>
            </div>
            <p className={styles.driverRole}>Driver</p>

            <div className={styles.driverMetaRow}>
              <span className={styles.metaLabel}>Status:</span>
              <span className={styles.metaValue}>
                {driverStatusLabel}
              </span>
            </div>

            {driver.shop && (
              <div className={styles.driverMetaRow}>
                <span className={styles.metaLabel}>Shop:</span>
                <span className={styles.metaValue}>
                  {driver.shop.name} {driver.shop.city && `(${driver.shop.city})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Contact Info</h4>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email || ""}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Phone</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        {/* Performance */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Performance</h4>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Trips Completed</span>
              <span className={styles.statValue}>
                {driver.totalTripsCompleted ?? 0}
              </span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.statValue}>
                {driver.performanceScore != null
                  ? driver.performanceScore.toFixed(1)
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Last Known Location</h4>
          {driver.currentLat != null && driver.currentLng != null ? (
            <p className={styles.locationText}>
              Lat: <strong>{driver.currentLat.toFixed(5)}</strong> &nbsp;|&nbsp;
              Lng: <strong>{driver.currentLng.toFixed(5)}</strong>
            </p>
          ) : (
            <p className={styles.empty}>No location data yet.</p>
          )}
        </div>

        {/* Actions */}
        <div className={styles.drawerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerDriverDrawer;
