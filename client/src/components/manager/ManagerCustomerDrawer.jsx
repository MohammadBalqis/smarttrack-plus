// client/src/components/manager/ManagerCustomerDrawer.jsx
import React, { useMemo } from "react";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomerDrawer = ({ open, onClose, details, loading }) => {
  const { branding } = useBranding();
  if (!open) return null;

  const primary = branding?.primaryColor || "#2563eb";

  const customer = details?.customer || null;
  const stats = details?.stats || {};
  const trips = useMemo(
    () => details?.recentTrips || details?.trips || [],
    [details]
  );

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleString();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* HEADER */}
        <div className={styles.drawerHeader}>
          <h2 style={{ color: primary }}>Customer</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {loading && <p className={styles.smallInfo}>Loading…</p>}

        {!loading && !customer && (
          <p className={styles.error}>Customer not found.</p>
        )}

        {!loading && customer && (
          <>
            {/* PROFILE */}
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
                  style={{ background: primary }}
                >
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
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

            {/* STATS */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span>Total Trips</span>
                <strong>{stats.totalTrips || 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Delivered</span>
                <strong>{stats.deliveredTrips || 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Cancelled</span>
                <strong>{stats.cancelledTrips || 0}</strong>
              </div>
              <div className={styles.statCard}>
                <span>Last Trip</span>
                <strong>{formatDate(stats.lastTripAt)}</strong>
              </div>
            </div>

            {/* RECENT TRIPS */}
            <h3 className={styles.subTitle}>Recent Trips</h3>

            {trips.length === 0 ? (
              <p className={styles.empty}>No trips yet.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Pickup</th>
                      <th>Dropoff</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.slice(0, 8).map((t) => (
                      <tr key={t._id}>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[`badgeStatus_${t.status}`] || ""
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td>
                          {t.pickupLocation?.address ||
                            t.pickupAddress ||
                            "—"}
                        </td>
                        <td>
                          {t.dropoffLocation?.address ||
                            t.dropoffAddress ||
                            "—"}
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
