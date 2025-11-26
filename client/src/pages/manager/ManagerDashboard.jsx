// client/src/pages/manager/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerDashboardStatsApi,
  getManagerRecentTripsApi,
  getManagerRecentOrdersApi,
  getManagerNotificationsApi,
} from "../../api/managerDashboardApi";
import styles from "../../styles/manager/managerDashboard.module.css";

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, tripsRes, ordersRes, notiRes] = await Promise.all([
        getManagerDashboardStatsApi(),
        getManagerRecentTripsApi(),
        getManagerRecentOrdersApi(),
        getManagerNotificationsApi(),
      ]);

      setStats(statsRes.data?.stats || null);
      setRecentTrips(tripsRes.data?.trips || []);
      setRecentOrders(ordersRes.data?.orders || []);
      setNotifications(notiRes.data?.notifications || []);
    } catch (err) {
      console.error("Error loading manager dashboard:", err);
      const msg =
        err?.response?.data?.error || "Failed to load manager dashboard data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const refreshTables = async () => {
    try {
      setLoadingTable(true);
      const [tripsRes, ordersRes] = await Promise.all([
        getManagerRecentTripsApi(),
        getManagerRecentOrdersApi(),
      ]);
      setRecentTrips(tripsRes.data?.trips || []);
      setRecentOrders(ordersRes.data?.orders || []);
    } catch (err) {
      console.error("Error refreshing tables:", err);
    } finally {
      setLoadingTable(false);
    }
  };

  const safe = (obj, key, fallback = 0) =>
    obj && typeof obj[key] === "number" ? obj[key] : fallback;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Manager Dashboard</h1>
          <p className={styles.subtitle}>
            Live overview of your company&apos;s operations: drivers, vehicles,
            trips, and orders.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={loadAll}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh All"}
          </button>
          <button
            type="button"
            className={styles.refreshLightBtn}
            onClick={refreshTables}
            disabled={loadingTable}
          >
            {loadingTable ? "Refreshing lists..." : "Refresh Lists"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Drivers</span>
          <span className={styles.kpiNumber}>
            {safe(stats, "totalDrivers")}
          </span>
          <span className={styles.kpiHint}>
            Active: {safe(stats, "activeDrivers")}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Vehicles</span>
          <span className={styles.kpiNumber}>
            {safe(stats, "totalVehicles")}
          </span>
          <span className={styles.kpiHint}>
            Available: {safe(stats, "availableVehicles")}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Trips</span>
          <span className={styles.kpiNumber}>{safe(stats, "totalTrips")}</span>
          <span className={styles.kpiHint}>
            Active: {safe(stats, "activeTrips")}
          </span>
        </div>

        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Total Orders</span>
          <span className={styles.kpiNumber}>{safe(stats, "totalOrders")}</span>
          <span className={styles.kpiHint}>
            Pending: {safe(stats, "pendingOrders")}
          </span>
        </div>
      </div>

      {/* Secondary KPI row */}
      <div className={styles.kpiGridSecondary}>
        <div className={styles.kpiCardSmall}>
          <span className={styles.kpiLabel}>Revenue Today</span>
          <span className={styles.kpiNumber}>
            $
            {stats && typeof stats.revenueToday === "number"
              ? stats.revenueToday.toFixed(2)
              : "0.00"}
          </span>
        </div>
        <div className={styles.kpiCardSmall}>
          <span className={styles.kpiLabel}>Revenue (This Month)</span>
          <span className={styles.kpiNumber}>
            $
            {stats && typeof stats.revenueMonth === "number"
              ? stats.revenueMonth.toFixed(2)
              : "0.00"}
          </span>
        </div>
        <div className={styles.kpiCardSmall}>
          <span className={styles.kpiLabel}>Drivers Online</span>
          <span className={styles.kpiNumber}>
            {safe(stats, "driversOnline")}
          </span>
        </div>
        <div className={styles.kpiCardSmall}>
          <span className={styles.kpiLabel}>Vehicles In Use</span>
          <span className={styles.kpiNumber}>
            {safe(stats, "vehiclesInUse")}
          </span>
        </div>
      </div>

      {/* Main 2-column content */}
      <div className={styles.mainGrid}>
        {/* Left: Recent Trips */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Trips</h2>
            {loadingTable && (
              <span className={styles.smallInfo}>Refreshing...</span>
            )}
          </div>

          {recentTrips.length === 0 && !loading ? (
            <p className={styles.empty}>No trips found yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Driver</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t._id}>
                      <td className={styles.idCell}>{t._id}</td>
                      <td>{t.driver?.name || "—"}</td>
                      <td>{t.customer?.name || "—"}</td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[`tripStatus_${t.status}`] || ""
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>
                        $
                        {typeof t.deliveryFee === "number"
                          ? t.deliveryFee.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Recent Orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Orders</h2>
            {loadingTable && (
              <span className={styles.smallInfo}>Refreshing...</span>
            )}
          </div>

          {recentOrders.length === 0 && !loading ? (
            <p className={styles.empty}>No orders found yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td className={styles.idCell}>{o._id}</td>
                      <td>{o.customer?.name || "—"}</td>
                      <td>
                        $
                        {typeof o.total === "number"
                          ? o.total.toFixed(2)
                          : "0.00"}
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${
                            styles[`orderStatus_${o.status}`] || ""
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notifications + Activity */}
      <div className={styles.bottomGrid}>
        {/* Notifications */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Latest Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <ul className={styles.notificationsList}>
              {notifications.slice(0, 6).map((n) => (
                <li
                  key={n._id}
                  className={`${styles.notificationItem} ${
                    n.isRead ? styles.notificationRead : ""
                  }`}
                >
                  <div className={styles.notificationMain}>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                  </div>
                  <div className={styles.notificationMeta}>
                    <span className={styles.notificationType}>{n.type}</span>
                    <span className={styles.notificationTime}>
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick Summary */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Quick Summary</h2>
          </div>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pending Orders</span>
              <span className={styles.summaryNumber}>
                {safe(stats, "pendingOrders")}
              </span>
              <span className={styles.summaryHint}>
                Prioritize these in Orders page.
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Active Trips</span>
              <span className={styles.summaryNumber}>
                {safe(stats, "activeTrips")}
              </span>
              <span className={styles.summaryHint}>
                Monitor drivers on the Trips page.
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Drivers Offline</span>
              <span className={styles.summaryNumber}>
                {safe(stats, "totalDrivers") - safe(stats, "driversOnline")}
              </span>
              <span className={styles.summaryHint}>
                Check their status on Drivers page.
              </span>
            </div>

            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Vehicles in Maintenance</span>
              <span className={styles.summaryNumber}>
                {safe(stats, "vehiclesInMaintenance")}
              </span>
              <span className={styles.summaryHint}>
                Keep fleet healthy in Vehicles page.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
