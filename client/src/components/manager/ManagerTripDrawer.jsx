// client/src/components/manager/ManagerTripDrawer.jsx
import React from "react";
import styles from "../../styles/manager/managerTrips.module.css";

const ManagerTripDrawer = ({ open, onClose, trip }) => {
  if (!open || !trip) return null;

  const {
    _id,
    status,
    liveStatus,
    pickupLocation,
    dropoffLocation,
    driverId,
    customerId,
    vehicleId,
    deliveryFee,
    paymentStatus,
    totalAmount,
    createdAt,
    startTime,
    endTime,
    totalDistance,
  } = trip;

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  const getStatusLabel = () => {
    if (!status) return "—";
    if (status === "in_progress") return "In Progress";
    if (status === "assigned") return "Assigned";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <h2>Trip Details</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className={styles.drawerSection}>
          <h3>Basic Info</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Trip ID:</span>
              <span className={styles.value}>{_id}</span>
            </div>
            <div>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.badge} ${styles[`badgeStatus_${status}`] || ""}`}>
                {getStatusLabel()}
              </span>
            </div>
            <div>
              <span className={styles.label}>Live Status:</span>
              <span className={styles.value}>{liveStatus || "—"}</span>
            </div>
            <div>
              <span className={styles.label}>Payment Status:</span>
              <span className={styles.value}>
                {paymentStatus || "unpaid"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <h3>Locations</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Pickup:</span>
              <span className={styles.value}>
                {pickupLocation?.address || "—"}
              </span>
            </div>
            <div>
              <span className={styles.label}>Dropoff:</span>
              <span className={styles.value}>
                {dropoffLocation?.address || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <h3>People & Vehicle</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Driver:</span>
              <span className={styles.value}>
                {driverId?.name || "—"}
              </span>
            </div>
            <div>
              <span className={styles.label}>Customer:</span>
              <span className={styles.value}>
                {customerId?.name || "—"}
              </span>
            </div>
            <div>
              <span className={styles.label}>Vehicle:</span>
              <span className={styles.value}>
                {vehicleId
                  ? `${vehicleId.brand || ""} ${vehicleId.model || ""} (${vehicleId.plateNumber || ""})`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <h3>Financial</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Delivery Fee:</span>
              <span className={styles.value}>
                {typeof deliveryFee === "number"
                  ? `${deliveryFee.toFixed(2)}`
                  : "0.00"}
              </span>
            </div>
            <div>
              <span className={styles.label}>Total Amount:</span>
              <span className={styles.value}>
                {typeof totalAmount === "number"
                  ? `${totalAmount.toFixed(2)}`
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.drawerSection}>
          <h3>Timing & Distance</h3>
          <div className={styles.infoGrid}>
            <div>
              <span className={styles.label}>Created At:</span>
              <span className={styles.value}>
                {formatDateTime(createdAt)}
              </span>
            </div>
            <div>
              <span className={styles.label}>Start Time:</span>
              <span className={styles.value}>
                {formatDateTime(startTime)}
              </span>
            </div>
            <div>
              <span className={styles.label}>End Time:</span>
              <span className={styles.value}>
                {formatDateTime(endTime)}
              </span>
            </div>
            <div>
              <span className={styles.label}>Total Distance (km):</span>
              <span className={styles.value}>
                {typeof totalDistance === "number"
                  ? totalDistance.toFixed(2)
                  : "0.00"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.closeBtnSecondary}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManagerTripDrawer;
