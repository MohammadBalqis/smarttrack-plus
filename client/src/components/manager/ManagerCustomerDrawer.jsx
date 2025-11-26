// client/src/components/manager/ManagerCustomerDrawer.jsx
import React from "react";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomerDrawer = ({ open, onClose, details }) => {
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

  const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <div className={styles.drawerHeader}>
          <h2>Customer Details</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {!customer ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Profile */}
            <div className={styles.drawerProfile}>
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className={styles.drawerAvatar}
                />
              ) : (
                <div className={styles.drawerAvatarFallback}>
                  {customer.name?.[0] || "C"}
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
              </div>
            </div>

            {/* Stats */}
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
                <span className={styles.statLabel}>Estimated Total</span>
                <span className={styles.statNumber}>
                  {safeStats.totalAmount?.toFixed
                    ? `$${safeStats.totalAmount.toFixed(2)}`
                    : `$${Number(safeStats.totalAmount || 0).toFixed(2)}`
                  }
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>First Trip</span>
                <span className={styles.statNumber}>
                  {formatDateTime(safeStats.firstTripAt)}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Last Trip</span>
                <span className={styles.statNumber}>
                  {formatDateTime(safeStats.lastTripAt)}
                </span>
              </div>
            </div>

            {/* Recent Trips */}
            <h3 className={styles.subTitle}>Recent Trips</h3>
            {(!recentTrips || recentTrips.length === 0) ? (
              <p className={styles.empty}>No recent trips for this customer.</p>
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
                        <td>{t.status}</td>
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
                        <td>{formatDateTime(t.createdAt)}</td>
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
