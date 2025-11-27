// client/src/pages/manager/ManagerDashboard.jsx
import React, { useEffect, useState } from "react";

import {
  getManagerDashboardStatsApi,
  getManagerRecentTripsApi,
  getManagerRecentOrdersApi,
  getManagerNotificationsApi,
} from "../../api/managerDashboardApi";

import { getBrandingApi } from "../../api/brandingApi";
import { useBranding } from "../../context/BrandingContext";

import styles from "../../styles/manager/managerDashboard.module.css";

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState("");

  // 🎨 BRANDING COLORS
  const { branding, updateBranding } = useBranding();
  const brandColor = branding?.primaryColor || "#2563EB";
  const brandColorLight = branding?.accentColor || "#E5F1FF";

  /* =====================================
        INITIAL LOAD (BRANDING + DATA)
  ====================================== */
  useEffect(() => {
    loadBranding();
    loadAll();
  }, []);

  const loadBranding = async () => {
    try {
      const res = await getBrandingApi();
      updateBranding(res.data.branding);
    } catch (err) {
      console.error("Branding load failed:", err);
    }
  };

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
      console.error("Manager Dashboard Load Error:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to load manager dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================
       REFRESH TRIPS + ORDERS ONLY
  ====================================== */
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
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title} style={{ color: brandColor }}>
            Manager Dashboard
          </h1>
          <p className={styles.subtitle}>
            Live overview of your company’s operations.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            style={{ backgroundColor: brandColor }}
            onClick={loadAll}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh All"}
          </button>

          <button
            type="button"
            className={styles.refreshLightBtn}
            style={{ borderColor: brandColor, color: brandColor }}
            onClick={refreshTables}
            disabled={loadingTable}
          >
            {loadingTable ? "Refreshing..." : "Refresh Lists"}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        {[
          {
            label: "Total Drivers",
            value: safe(stats, "totalDrivers"),
            hint: `Active: ${safe(stats, "activeDrivers")}`,
          },
          {
            label: "Total Vehicles",
            value: safe(stats, "totalVehicles"),
            hint: `Available: ${safe(stats, "availableVehicles")}`,
          },
          {
            label: "Total Trips",
            value: safe(stats, "totalTrips"),
            hint: `Active: ${safe(stats, "activeTrips")}`,
          },
          {
            label: "Total Orders",
            value: safe(stats, "totalOrders"),
            hint: `Pending: ${safe(stats, "pendingOrders")}`,
          },
        ].map((card, i) => (
          <div
            key={i}
            className={styles.kpiCard}
            style={{ borderTop: `4px solid ${brandColor}` }}
          >
            <span className={styles.kpiLabel}>{card.label}</span>
            <span className={styles.kpiNumber} style={{ color: brandColor }}>
              {card.value}
            </span>
            <span className={styles.kpiHint}>{card.hint}</span>
          </div>
        ))}
      </div>

      {/* SECONDARY KPI */}
      <div className={styles.kpiGridSecondary}>
        {[
          { label: "Revenue Today", value: stats?.revenueToday },
          { label: "Revenue (Month)", value: stats?.revenueMonth },
          { label: "Drivers Online", value: stats?.driversOnline },
          { label: "Vehicles In Use", value: stats?.vehiclesInUse },
        ].map((item, i) => (
          <div
            key={i}
            className={styles.kpiCardSmall}
            style={{ borderLeft: `4px solid ${brandColor}` }}
          >
            <span className={styles.kpiLabel}>{item.label}</span>
            <span className={styles.kpiNumber} style={{ color: brandColor }}>
              {typeof item.value === "number"
                ? item.value.toFixed(2)
                : item.value}
            </span>
          </div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className={styles.mainGrid}>
        {/* TRIPS */}
        <div className={styles.card}>
          <div
            className={styles.cardHeader}
            style={{ borderBottom: `2px solid ${brandColor}` }}
          >
            <h2>Recent Trips</h2>
          </div>

          {recentTrips.length === 0 && !loading ? (
            <p className={styles.empty}>No trips found yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr style={{ background: brandColorLight }}>
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
                          className={styles.statusBadge}
                          style={{
                            background:
                              t.status === "completed"
                                ? brandColorLight
                                : undefined,
                            color:
                              t.status === "completed"
                                ? brandColor
                                : undefined,
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td>${t.deliveryFee?.toFixed(2)}</td>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ORDERS */}
        <div className={styles.card}>
          <div
            className={styles.cardHeader}
            style={{ borderBottom: `2px solid ${brandColor}` }}
          >
            <h2>Recent Orders</h2>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr style={{ background: brandColorLight }}>
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
                    <td>${o.total?.toFixed(2)}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          background:
                            o.status === "completed" ||
                            o.status === "delivered"
                              ? brandColorLight
                              : undefined,
                          color:
                            o.status === "completed" ||
                            o.status === "delivered"
                              ? brandColor
                              : undefined,
                        }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS + SUMMARY */}
      <div className={styles.bottomGrid}>
        {/* NOTIFICATIONS */}
        <div className={styles.card}>
          <div
            className={styles.cardHeader}
            style={{ borderBottom: `2px solid ${brandColor}` }}
          >
            <h2>Latest Notifications</h2>
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>No notifications yet.</p>
          ) : (
            <ul className={styles.notificationsList}>
              {notifications.slice(0, 6).map((n) => (
                <li
                  key={n._id}
                  className={styles.notificationItem}
                  style={{
                    borderLeft: `4px solid ${brandColor}`,
                  }}
                >
                  <div className={styles.notificationMain}>
                    <h4>{n.title}</h4>
                    <p>{n.message}</p>
                  </div>
                  <div className={styles.notificationMeta}>
                    <span className={styles.notificationType}>{n.type}</span>
                    <span className={styles.notificationTime}>
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* SUMMARY */}
        <div className={styles.card}>
          <div
            className={styles.cardHeader}
            style={{ borderBottom: `2px solid ${brandColor}` }}
          >
            <h2>Quick Summary</h2>
          </div>

          <div className={styles.summaryGrid}>
            {[
              { label: "Pending Orders", value: safe(stats, "pendingOrders") },
              { label: "Active Trips", value: safe(stats, "activeTrips") },
              {
                label: "Drivers Offline",
                value:
                  safe(stats, "totalDrivers") - safe(stats, "driversOnline"),
              },
              {
                label: "Vehicles in Maintenance",
                value: safe(stats, "vehiclesInMaintenance"),
              },
            ].map((item, i) => (
              <div
                key={i}
                className={styles.summaryItem}
                style={{ borderLeft: `4px solid ${brandColor}` }}
              >
                <span className={styles.summaryLabel}>{item.label}</span>
                <span
                  className={styles.summaryNumber}
                  style={{ color: brandColor }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
