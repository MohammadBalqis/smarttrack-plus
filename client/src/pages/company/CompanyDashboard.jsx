import React, { useEffect, useState } from "react";
import { getCompanyDashboardStatsApi } from "../../api/companyDashboardApi";
import styles from "../../styles/company/companyDashboard.module.css";

// Recharts (install if not yet): npm install recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const CompanyDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [driverStats, setDriverStats] = useState([]);
  const [lastTrips, setLastTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyDashboardStatsApi();
      if (res.data.ok) {
        setKpis(res.data.kpis);
        setTimeline(res.data.timeline || []);
        setDriverStats(res.data.driverStats || []);
        setLastTrips(res.data.lastTrips || []);
      } else {
        setError("Failed to load dashboard stats.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard stats.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!kpis) {
    return <div className={styles.error}>No data available.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Company Dashboard</h1>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h3>Total Trips</h3>
          <p className={styles.number}>{kpis.totalTrips}</p>
        </div>

        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>
            ${kpis.totalRevenue?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Trips Today</h3>
          <p className={styles.number}>{kpis.tripsToday}</p>
        </div>

        <div className={styles.card}>
          <h3>Revenue Today</h3>
          <p className={styles.number}>
            ${kpis.revenueToday?.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Trips This Month</h3>
          <p className={styles.number}>{kpis.tripsThisMonth}</p>
        </div>

        <div className={styles.card}>
          <h3>Revenue This Month</h3>
          <p className={styles.number}>
            ${kpis.revenueThisMonth?.toFixed(2) || "0.00"}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Revenue over time */}
        <div className={styles.chartCard}>
          <h3>Revenue Over Time</h3>
          {timeline.length === 0 ? (
            <p className={styles.muted}>No trips yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  name="Revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="totalTrips"
                  name="Trips"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Trips per driver */}
        <div className={styles.chartCard}>
          <h3>Trips per Driver</h3>
          {driverStats.length === 0 ? (
            <p className={styles.muted}>No drivers with delivered trips yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={driverStats.map((d) => ({
                  name: d.driverName,
                  trips: d.totalTrips,
                  revenue: d.totalRevenue,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trips" name="Trips" fill="#6366f1" />
                <Bar dataKey="revenue" name="Revenue" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Last Trips Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Last Delivered Trips</h3>
        </div>

        {lastTrips.length === 0 ? (
          <p className={styles.muted}>No delivered trips yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Driver</th>
                  <th>Pickup</th>
                  <th>Dropoff</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lastTrips.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td>{t.driverName}</td>
                    <td>{t.pickupAddress}</td>
                    <td>{t.dropoffAddress}</td>
                    <td>
                      <span className={styles.badgeDelivered}>
                        {t.status}
                      </span>
                    </td>
                    <td>${t.totalAmount?.toFixed(2) || "0.00"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;
