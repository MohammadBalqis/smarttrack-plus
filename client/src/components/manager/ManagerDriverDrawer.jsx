// client/src/components/manager/ManagerCustomerDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerCustomerOrdersApi,
  getManagerCustomerStatsApi,
} from "../../api/managerCustomersApi";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomerDrawer = ({ open, onClose, customer }) => {
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !customer?._id) return;

    const load = async () => {
      setError("");
      setStats(null);
      setOrders([]);
      setLoadingStats(true);
      setLoadingOrders(true);

      try {
        const [statsRes, ordersRes] = await Promise.all([
          getManagerCustomerStatsApi(customer._id).catch((err) => {
            console.error("Stats error:", err);
            return null;
          }),
          getManagerCustomerOrdersApi(customer._id).catch((err) => {
            console.error("Orders error:", err);
            return null;
          }),
        ]);

        if (statsRes?.data?.stats) {
          setStats(statsRes.data.stats);
        }

        if (ordersRes?.data?.orders) {
          setOrders(ordersRes.data.orders);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load customer details.");
      } finally {
        setLoadingStats(false);
        setLoadingOrders(false);
      }
    };

    load();
  }, [open, customer]);

  if (!open || !customer) return null;

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h3>Customer Details</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Basic info */}
        <div className={styles.customerInfo}>
          <div className={styles.avatarWrapper}>
            {customer.profileImage ? (
              <img
                src={customer.profileImage}
                alt={customer.name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {getInitials(customer.name)}
              </div>
            )}
          </div>
          <div className={styles.customerTextInfo}>
            <h4>{customer.name || "Unnamed customer"}</h4>
            <p>{customer.email}</p>
            <p>{customer.phone || "No phone"}</p>
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
        <div className={styles.statsSection}>
          <h4>Customer Stats (for this company)</h4>
          {loadingStats && <p className={styles.smallInfo}>Loading stats...</p>}
          {!loadingStats && stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Orders</span>
                <span className={styles.statValue}>
                  {stats.totalOrders ?? 0}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Delivered</span>
                <span className={styles.statValue}>
                  {stats.deliveredCount ?? 0}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Cancelled</span>
                <span className={styles.statValue}>
                  {stats.cancelledCount ?? 0}
                </span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Total Spent</span>
                <span className={styles.statValue}>
                  {stats.totalSpent?.toFixed
                    ? stats.totalSpent.toFixed(2)
                    : Number(stats.totalSpent || 0).toFixed(2)}{" "}
                  $
                </span>
              </div>
              <div className={styles.statCardWide}>
                <span className={styles.statLabel}>Last Order</span>
                <span className={styles.statValue}>
                  {stats.lastOrderDate
                    ? new Date(stats.lastOrderDate).toLocaleString()
                    : "—"}
                </span>
              </div>
            </div>
          )}
          {!loadingStats && !stats && !error && (
            <p className={styles.smallInfo}>No stats yet for this customer.</p>
          )}
        </div>

        {/* Orders list */}
        <div className={styles.ordersSection}>
          <h4>Recent Orders with this Company</h4>
          {loadingOrders && (
            <p className={styles.smallInfo}>Loading orders...</p>
          )}
          {error && <p className={styles.error}>{error}</p>}

          {!loadingOrders && orders.length === 0 && !error && (
            <p className={styles.smallInfo}>No orders found.</p>
          )}

          {!loadingOrders && orders.length > 0 && (
            <div className={styles.ordersList}>
              {orders.slice(0, 10).map((o) => (
                <div key={o._id} className={styles.orderItem}>
                  <div>
                    <div className={styles.orderHeaderRow}>
                      <span className={styles.orderId}>
                        #{String(o._id).slice(-6)}
                      </span>
                      <span
                        className={
                          o.status === "delivered"
                            ? styles.badgeDelivered
                            : o.status === "cancelled"
                            ? styles.badgeCancelled
                            : styles.badgePending
                        }
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className={styles.orderMeta}>
                      Total:{" "}
                      <strong>
                        {Number(o.total || 0).toFixed(2)} $
                      </strong>
                      {" · "}
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString()
                        : ""}
                    </p>
                    {o.driverId && (
                      <p className={styles.orderMeta}>
                        Driver: {o.driverId.name || "—"}
                      </p>
                    )}
                    {o.vehicleId && (
                      <p className={styles.orderMeta}>
                        Vehicle: {o.vehicleId.plateNumber} (
                        {o.vehicleId.brand} {o.vehicleId.model})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerCustomerDrawer;
