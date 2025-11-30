import React, { useState, useMemo } from "react";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerCustomers.module.css";

/**
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - details: {
 *      customer,
 *      stats,
 *      recentTrips? / trips?,
 *      orders? / recentOrders?
 *    }
 *  - loading: boolean
 *  - onToggleActive?: (customerId: string, currentStatus: boolean) => Promise<void> | void
 */
const ManagerCustomerDrawer = ({
  open,
  onClose,
  details,
  loading,
  onToggleActive,
}) => {
  const { branding } = useBranding();
  const [statusLoading, setStatusLoading] = useState(false);

  if (!open) return null;

  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  // Safely destructure
  const customer = details?.customer || null;
  const stats = details?.stats || null;

  // Support both `recentTrips` and `trips`
  const tripsRaw = details?.recentTrips || details?.trips || [];

  // Support both `orders` and `recentOrders`
  const ordersRaw = details?.orders || details?.recentOrders || [];

  const safeStats = {
    totalTrips: stats?.totalTrips || 0,
    deliveredTrips: stats?.deliveredTrips || 0,
    cancelledTrips: stats?.cancelledTrips || 0,
    totalAmount: stats?.totalAmount || 0,
    firstTripAt: stats?.firstTripAt || null,
    lastTripAt: stats?.lastTripAt || null,
    totalOrders: stats?.totalOrders || 0,
    totalOrderAmount: stats?.totalOrderAmount || 0,
  };

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleString();
  };

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  const formatMoney = (v) => {
    const num = typeof v === "number" ? v : Number(v || 0);
    return `$${num.toFixed(2)}`;
  };

  const trips = useMemo(() => tripsRaw || [], [tripsRaw]);
  const orders = useMemo(() => ordersRaw || [], [ordersRaw]);

  const handleToggleClick = async () => {
    if (!customer || !onToggleActive || statusLoading) return;
    try {
      setStatusLoading(true);
      await onToggleActive(customer._id, customer.isActive);
    } catch (err) {
      console.error("Toggle active error:", err);
      alert("Failed to update customer status.");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* HEADER */}
        <div className={styles.drawerHeader}>
          <h2 style={{ color: primary }}>Customer Details</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* LOADING */}
        {loading && <p className={styles.smallInfo}>Loading customer...</p>}

        {/* ERROR */}
        {!loading && !customer && (
          <p className={styles.error}>Customer not found.</p>
        )}

        {/* MAIN CONTENT */}
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
                  style={{ backgroundColor: primary }}
                >
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
              )}

              <div className={styles.drawerProfileInfo}>
                <h3>{customer.name}</h3>
                <p className={styles.drawerEmail}>{customer.email}</p>
                <p className={styles.drawerPhone}>
                  {customer.phone || customer.phoneNumber || "—"}
                </p>

                <div className={styles.drawerStatusRow}>
                  <span
                    className={
                      customer.isActive
                        ? styles.statusBadgeActive
                        : styles.statusBadgeInactive
                    }
                    style={{
                      backgroundColor: customer.isActive ? accent : "#bbb",
                    }}
                  >
                    {customer.isActive ? "Active" : "Inactive"}
                  </span>

                  {/* Toggle Active Button */}
                  <button
                    type="button"
                    className={styles.statusToggleBtn}
                    onClick={handleToggleClick}
                    disabled={!onToggleActive || statusLoading}
                    style={{
                      backgroundColor: customer.isActive ? "#d9534f" : accent,
                    }}
                  >
                    {statusLoading
                      ? "Updating..."
                      : customer.isActive
                      ? "Suspend"
                      : "Activate"}
                  </button>
                </div>

                <p className={styles.joinedText}>
                  Joined: {formatDate(customer.createdAt)}
                </p>
              </div>
            </div>

            {/* STATS GRID */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Trips</span>
                <span className={styles.statNumber}>
                  {safeStats.totalTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Delivered Trips</span>
                <span className={styles.statNumber}>
                  {safeStats.deliveredTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Cancelled Trips</span>
                <span className={styles.statNumber}>
                  {safeStats.cancelledTrips}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Trip Spend</span>
                <span className={styles.statNumber}>
                  {formatMoney(safeStats.totalAmount)}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Orders</span>
                <span className={styles.statNumber}>
                  {safeStats.totalOrders}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Order Spend</span>
                <span className={styles.statNumber}>
                  {formatMoney(safeStats.totalOrderAmount)}
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

            {/* RECENT TRIPS */}
            <h3 className={styles.subTitle}>Recent Trips</h3>

            {!trips || trips.length === 0 ? (
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
                    {trips.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              styles[`badgeStatus_${t.status}`] || ""
                            }`}
                          >
                            {t.status === "in_progress"
                              ? "In Progress"
                              : t.status?.charAt(0).toUpperCase() +
                                t.status?.slice(1)}
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

            {/* RECENT ORDERS */}
            {orders && orders.length > 0 && (
              <>
                <h3 className={styles.subTitle}>Recent Orders</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Total</th>
                        <th>Driver</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <span
                              className={`${styles.badge} ${
                                styles[`badgeOrderStatus_${o.status}`] || ""
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td>{o.orderType || o.category || "—"}</td>
                          <td>{formatMoney(o.total || o.totalAmount)}</td>
                          <td>{o.driverId?.name || "—"}</td>
                          <td>{formatDateTime(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerCustomerDrawer;
