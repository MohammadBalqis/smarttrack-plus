// client/src/components/customer/CustomerTripDrawer.jsx
import React from "react";
import styles from "../../styles/customer/trips.module.css";

const CustomerTripDrawer = ({ open, onClose, trip }) => {
  if (!open || !trip) return null;

  const t = trip;

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return d.toLocaleString();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.drawerCloseBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.drawerTitle}>
          Tracking #{String(t._id).slice(-6)}
        </h2>

        {/* STATUS */}
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Current Status:</span>
          <span
            className={
              styles[`statusBadge_${t.status}`] || styles.statusBadge_default
            }
          >
            {t.status.toUpperCase()}
          </span>
        </div>

        {/* MAP PLACEHOLDER */}
        <div className={styles.mapBox}>
          <div className={styles.mapPlaceholder}>
            <p>Live Tracking Preview</p>
            <small>(Google Maps coming after security phase)</small>
          </div>
        </div>

        {/* DRIVER */}
        <div className={styles.sectionCard}>
          <h3>Driver Information</h3>
          {t.driverId ? (
            <div className={styles.driverRow}>
              <img
                src={t.driverId.profileImage || "/default.png"}
                alt="driver"
                className={styles.driverImg}
              />
              <div>
                <p className={styles.driverName}>{t.driverId.name}</p>
                <p className={styles.driverMeta}>{t.driverId.phone}</p>
              </div>
            </div>
          ) : (
            <p className={styles.muted}>No driver assigned yet.</p>
          )}
        </div>

        {/* VEHICLE */}
        <div className={styles.sectionCard}>
          <h3>Vehicle</h3>
          {t.vehicleId ? (
            <div>
              <p className={styles.line}>
                <strong>Type:</strong> {t.vehicleId.type}
              </p>
              <p className={styles.line}>
                <strong>Brand:</strong> {t.vehicleId.brand}
              </p>
              <p className={styles.line}>
                <strong>Plate:</strong> {t.vehicleId.plateNumber}
              </p>
            </div>
          ) : (
            <p className={styles.muted}>No vehicle assigned.</p>
          )}
        </div>

        {/* ADDRESSES */}
        <div className={styles.sectionCard}>
          <h3>Route</h3>
          <p>
            <strong>Pickup:</strong> {t.pickupLocation?.address}
          </p>
          <p>
            <strong>Dropoff:</strong> {t.dropoffLocation?.address}
          </p>
        </div>

        {/* TIMELINE */}
        <div className={styles.sectionCard}>
          <h3>Timeline</h3>
          <p className={styles.line}>
            <strong>Created:</strong> {formatDate(t.createdAt)}
          </p>
          {t.startTime && (
            <p className={styles.line}>
              <strong>Started:</strong> {formatDate(t.startTime)}
            </p>
          )}
          {t.endTime && (
            <p className={styles.line}>
              <strong>Delivered:</strong> {formatDate(t.endTime)}
            </p>
          )}
        </div>

        {/* FEES */}
        <div className={styles.sectionCard}>
          <h3>Fees</h3>
          <p className={styles.line}>
            <strong>Delivery Fee:</strong> ${t.deliveryFee?.toFixed(2)}
          </p>
          <p className={styles.line}>
            <strong>Total:</strong> $
            {(t.totalAmount || t.deliveryFee).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerTripDrawer;
