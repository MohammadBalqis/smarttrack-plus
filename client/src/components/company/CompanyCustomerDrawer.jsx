import React, { useEffect, useState } from "react";
import {
  getCompanyCustomerStatsApi,
  getCompanyCustomerOrdersApi,
  toggleCompanyCustomerStatusApi,
} from "../../api/companyCustomersApi";

import styles from "../../styles/company/companyCustomerDrawer.module.css";

const CompanyCustomerDrawer = ({ open, onClose, customer }) => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [error, setError] = useState("");

  // Load stats + orders
  useEffect(() => {
    if (open && customer?._id) loadCustomerData(customer._id);
  }, [open, customer]);

  const loadCustomerData = async (customerId) => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, ordersRes] = await Promise.all([
        getCompanyCustomerStatsApi(customerId),
        getCompanyCustomerOrdersApi(customerId),
      ]);

      setStats(statsRes.data.stats || null);
      setOrders(ordersRes.data.orders || []);
    } catch (err) {
      console.error("Drawer load error:", err);
      setError("Failed to load customer data.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async () => {
    if (!customer?._id) return;

    try {
      setToggleLoading(true);
      await toggleCompanyCustomerStatusApi(customer._id);

      // Update local UI
      customer.isActive = !customer.isActive;
    } catch (err) {
      console.error(err);
      alert("Failed to toggle status");
    } finally {
      setToggleLoading(false);
    }
  };

  if (!open || !customer) return null;

  const joinedDate =
    customer.createdAt && !isNaN(Date.parse(customer.createdAt))
      ? new Date(customer.createdAt).toLocaleDateString()
      : "—";

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {/* Title */}
        <h2 className={styles.drawerTitle}>Customer Details</h2>

        {/* PROFILE */}
        <div className={styles.profileCard}>
          <div className={styles.avatarCircle}>
            {customer.name?.charAt(0).toUpperCase() || "C"}
          </div>

          <div>
            <h3 className={styles.customerName}>{customer.name}</h3>
            <p className={styles.customerEmail}>{customer.email}</p>
            <p className={styles.customerPhone}>
              {customer.phoneNumber || "No phone"}
            </p>

            <span
              className={
                customer.isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive
              }
            >
              {customer.isActive ? "Active" : "Inactive"}
            </span>

            <p className={styles.joinedText}>Joined: {joinedDate}</p>
          </div>

          <button
            className={styles.toggleBtn}
            onClick={handleToggleActive}
            disabled={toggleLoading}
          >
            {toggleLoading
              ? "Updating..."
              : customer.isActive
              ? "Suspend"
              : "Activate"}
          </button>
        </div>

        {/* ERRORS */}
        {error && <p className={styles.error}>{error}</p>}

        {/* LOADING */}
        {loading && <p className={styles.smallInfo}>Loading...</p>}

        {/* STATS */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h4>Total Orders</h4>
              <p>{stats.totalOrders}</p>
            </div>

            <div className={styles.statCard}>
              <h4>Delivered</h4>
              <p>{stats.deliveredCount}</p>
            </div>

            <div className={styles.statCard}>
              <h4>Cancelled</h4>
              <p>{stats.cancelledCount}</p>
            </div>

            <div className={styles.statCard}>
              <h4>Total Spent</h4>
              <p>${stats.totalSpent?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        )}

        {/* ORDERS */}
        <div className={styles.section}>
          <h3>Customer Orders</h3>

          {orders.length === 0 ? (
            <p className={styles.empty}>No orders found.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={styles[`badge_${o.status}`]}>
                          {o.status}
                        </span>
                      </td>
                      <td>${o.total?.toFixed(2) || "0.00"}</td>
                      <td>{o.driverId?.name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyCustomerDrawer;
