// client/src/pages/manager/ManagerDashboard.jsx
import React, { useEffect, useState, useContext } from "react";

// ✅ Manager API (CORRECT)
import { getManagerDashboardStatsApi } from "../../api/managerDashboardApi";

// Branding
import { BrandingContext } from "../../context/BrandingContext";

// CSS
import styles from "../../styles/manager/managerDashboard.module.css";

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { branding } = useContext(BrandingContext);
  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  /* ==============================
     LOAD DASHBOARD DATA
  ============================== */
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getManagerDashboardStatsApi();
      const data = res.data || {};

      setStats(data.stats || {});
      setRecentTrips(data.recentTrips || []);
      setRecentOrders(data.recentOrders || []);
    } catch (err) {
      console.error("Manager Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==============================
     STATES
  ============================== */
  if (loading) {
    return <p className={styles.loading}>Loading dashboard…</p>;
  }

  if (error) {
    return <p className={styles.error}>{error}</p>;
  }

  if (!stats) {
    return <p className={styles.empty}>No dashboard data available.</p>;
  }

  /* ==============================
     RENDER
  ============================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1 style={{ color: primary }}>Manager Dashboard</h1>
        <p style={{ color: accent }}>
          Overview of company operations (manager view)
        </p>
      </div>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <h4>Total Trips</h4>
          <p>{stats.totalTrips ?? 0}</p>
        </div>

        <div className={styles.kpiCard}>
          <h4>Active Drivers</h4>
          <p>{stats.activeDrivers ?? 0}</p>
        </div>

        <div className={styles.kpiCard}>
          <h4>Total Revenue</h4>
          <p>${(stats.totalRevenue ?? 0).toFixed(2)}</p>
        </div>

        <div className={styles.kpiCard}>
          <h4>Active Orders</h4>
          <p>{stats.activeOrders ?? 0}</p>
        </div>

        <div className={styles.kpiCard}>
          <h4>Cancelled Orders</h4>
          <p>{stats.cancelledOrders ?? 0}</p>
        </div>

        <div className={styles.kpiCard}>
          <h4>Total Customers</h4>
          <p>{stats.totalCustomers ?? 0}</p>
        </div>
      </div>

      {/* RECENT TRIPS */}
      <div className={styles.section}>
        <h2 style={{ color: primary }}>Recent Trips</h2>

        {recentTrips.length === 0 ? (
          <p className={styles.empty}>No recent trips available.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr style={{ background: primary, color: "#fff" }}>
                <th>Date</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t) => (
                <tr key={t._id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>{t.status}</td>
                  <td>{t.driverId?.name || "—"}</td>
                  <td>${(t.totalAmount ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* RECENT ORDERS */}
      <div className={styles.section}>
        <h2 style={{ color: primary }}>Recent Orders</h2>

        {recentOrders.length === 0 ? (
          <p className={styles.empty}>No recent orders.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr style={{ background: primary, color: "#fff" }}>
                <th>Date</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o._id}>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>{o.status}</td>
                  <td>{o.customerId?.name || "—"}</td>
                  <td>${(o.total ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;
