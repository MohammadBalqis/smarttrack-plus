// client/src/components/manager/ManagerCustomerDrawer.jsx
import React from "react";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomerDrawer = ({ open, onClose, details, loading }) => {
  const { branding } = useBranding();

  if (!open) return null;

  const { customer, stats, recentTrips } = details || {};

  const safeStats = stats || {
    totalTrips: 0,
    deliveredTrips: 0,
    cancelledTrips: 0,
    totalAmount: 0,
    firstTripAt: null,
    lastTripAt: null,
  };

  const formatDate = (v) => {
    if (!v) return "—";
    const date = new Date(v);
    return isNaN(date) ? "—" : date.toLocaleString();
  };

  const formatMoney = (v) => {
    if (typeof v === "number") return `$${v.toFixed(2)}`;
    const n = Number(v || 0);
    return `$${n.toFixed(2)}`;
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>

        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2 style={{ color: branding.primaryColor }}>Customer Details</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Loading State */}
        {loading && <p className={styles.smallInfo}>Loading customer...</p>}

        {/* SAFETY CHECK */}
        {!loading && !customer && (
          <p className={styles.error}>Customer not found.</p>
        )}

        {!loading && customer && (
          <>
            {/* =============================
                PROFILE SECTION
            ============================== */}
            <div className={styles.drawerProfile}>
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className={styles.drawerAvatar}
                />
              ) : (
                <div
                  className={styles.drawerAvatarFallback}
                  style={{ background: branding.primaryColor }}
                >
                  {customer.name?.charAt(0) || "C"}
                </div>
              )}

              <div>
                <h3>{customer.name}</h3>
                <p>{customer.email}</p>
                <p>{customer.phone || "—"}</p>

                <span
                  className={
                    customer.isActive
                      ? styles.statusBadgeActive
                      : styles.statusBadgeInactive
                  }
                >
                  {customer.isActive ? "Active" : "Inactive"}
                </span>

                <p className={styles.joinedText}>
                  Joined: {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>

            {/* =============================
                STATS SECTION
            ============================== */}
            <div className={styles.statsGrid}>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Trips</span>
                <span className={styles.statNumber}>
                  {safeStats.totalTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Delivered</span>
                <span className={styles.statNumber}>
                  {safeStats.deliveredTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Cancelled</span>
                <span className={styles.statNumber}>
                  {safeStats.cancelledTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Spent</span>
                <span className={styles.statNumber}>
                  {formatMoney(safeStats.totalAmount)}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>First Trip</span>
                <span className={styles.statNumber}>
                  {formatDate(safeStats.firstTripAt)}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Last Trip</span>
                <span className={styles.statNumber}>
                  {formatDate(safeStats.lastTripAt)}
                </span>
              </div>
            </div>

            {/* =============================
                RECENT TRIPS
            ============================== */}
            <h3 className={styles.subTitle}>Recent Trips</h3>

            {!recentTrips || recentTrips.length === 0 ? (
              <p className={styles.empty}>No recent trips.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Driver</th>
                      <th>Vehicle</th>
                      <th>Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTrips.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[`badgeStatus_${t.status}`] || ""
                            }`}
                          >
                            {t.status === "in_progress"
                              ? "In Progress"
                              : t.status.charAt(0).toUpperCase() +
                                t.status.slice(1)}
                          </span>
                        </td>

                        <td>{t.pickupLocation?.address || "—"}</td>
                        <td>{t.dropoffLocation?.address || "—"}</td>

                        <td>{t.driverId?.name || "—"}</td>

                        <td>
                          {t.vehicleId
                            ? `${t.vehicleId.plateNumber || ""} ${
                                t.vehicleId.brand || ""
                              }`
                            : "—"}
                        </td>

                        <td>{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerCustomerDrawer;
