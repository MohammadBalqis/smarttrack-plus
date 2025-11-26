// client/src/pages/company/CompanyDashboard.jsx
import React, { useEffect, useState } from "react";
import { getCompanyDashboardApi } from "../../api/companyDashboardApi";
import styles from "../../styles/company/companyDashboard.module.css";

const CompanyDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [topDrivers, setTopDrivers] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getCompanyDashboardApi();
      const data = res.data;

      if (!data.ok) {
        throw new Error("Response not ok");
      }

      setKpis(data.kpis || null);
      setRevenue(data.revenueLast6Months || []);
      setTopDrivers(data.topDrivers || []);
      setRecentTrips(data.recentTrips || []);
      setRecentOrders(data.recentOrders || []);
    } catch (err) {
      console.error("Company dashboard load error:", err);
      setError("Failed to load company dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Company Dashboard</h1>
          <p className={styles.subtitle}>
            Overview of your company performance, trips, orders, and drivers.
          </p>
        </div>
        {kpis && (
          <div className={styles.headerRight}>
            <span className={styles.headerStat}>
              Total revenue:{" "}
              <strong>${kpis.totalRevenue?.toFixed(2) || "0.00"}</strong>
            </span>
            <span className={styles.headerStat}>
              Active trips: <strong>{kpis.activeTrips}</strong>
            </span>
          </div>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.smallInfo}>Loading dashboard...</p>}

      {/* KPI cards */}
      {kpis && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Drivers</span>
            <span className={styles.kpiValue}>{kpis.totalDrivers}</span>
            <span className={styles.kpiSub}>
              Active: {kpis.activeDrivers}
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Vehicles</span>
            <span className={styles.kpiValue}>{kpis.totalVehicles}</span>
            <span className={styles.kpiSub}>
              Available: {kpis.availableVehicles}
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Customers</span>
            <span className={styles.kpiValue}>{kpis.totalCustomers}</span>
            <span className={styles.kpiSub}>from orders</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Trips</span>
            <span className={styles.kpiValue}>{kpis.totalTrips}</span>
            <span className={styles.kpiSub}>
              Active: {kpis.activeTrips}
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Orders</span>
            <span className={styles.kpiValue}>{kpis.totalOrders}</span>
            <span className={styles.kpiSub}>
              Pending: {kpis.pendingOrders}
            </span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Revenue (all time)</span>
            <span className={styles.kpiValue}>
              ${kpis.totalRevenue?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>
      )}

      {/* Revenue + Top Drivers */}
      <div className={styles.row}>
        {/* Revenue trend */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Revenue (last 6 months)</h2>
          </div>
          {revenue.length === 0 ? (
            <p className={styles.empty}>No revenue data yet.</p>
          ) : (
            <div className={styles.revenueList}>
              {revenue.map((r) => (
                <div key={r.label} className={styles.revenueItem}>
                  <span>{r.label}</span>
                  <span>${r.totalCompanyEarning?.toFixed(2) || "0.00"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Drivers */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Top Drivers</h2>
          </div>
          {topDrivers.length === 0 ? (
            <p className={styles.empty}>No driver performance data yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Delivered Trips</th>
                    <th>Total Distance (km)</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.map((d) => (
                    <tr key={d.id}>
                      <td>{d.name}</td>
                      <td>{d.deliveredTrips}</td>
                      <td>{d.totalDistance || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Trips + Recent Orders */}
      <div className={styles.row}>
        {/* Recent trips */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Trips</h2>
          </div>
          {recentTrips.length === 0 ? (
            <p className={styles.empty}>No trips yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Route</th>
                    <th>Driver</th>
                    <th>Customer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td>
                        <div className={styles.routeText}>
                          <span>{t.pickupAddress}</span>
                          <span className={styles.routeArrow}>→</span>
                          <span>{t.dropoffAddress}</span>
                        </div>
                      </td>
                      <td>{t.driverName}</td>
                      <td>{t.customerName}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            styles[`badge_${t.status}`] || styles.badge_default
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Orders</h2>
          </div>
          {recentOrders.length === 0 ? (
            <p className={styles.empty}>No orders yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        {o.createdAt
                          ? new Date(o.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td>{o.customerName}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            styles[`badge_${o.status}`] || styles.badge_default
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>${o.total?.toFixed(2) || "0.00"}</td>
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

export default CompanyDashboard;
