// client/src/pages/owner/SystemOwnerDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getOwnerOverviewApi,
  getOwnerCompaniesActivityApi,
  getOwnerRevenueChartApi,
} from "../../api/ownerApi";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import styles from "../../styles/systemOwner/ownerDashboard.module.css";

/* ==========================================================
   SUBSCRIPTION TIER CALCULATOR
========================================================== */
const getSubscriptionTier = (driverCount) => {
  if (driverCount <= 10) return { tier: "Basic", price: 50 };
  if (driverCount <= 30) return { tier: "Standard", price: 80 };
  if (driverCount <= 50) return { tier: "Pro", price: 100 };
  return { tier: "Enterprise", price: 150 };
};

const SystemOwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [ovRes, compRes, chartRes] = await Promise.all([
        getOwnerOverviewApi(),
        getOwnerCompaniesActivityApi(),
        getOwnerRevenueChartApi(),
      ]);

      setOverview(ovRes.data || {});
      setCompanies(compRes.data?.companies || []);
      setChartData(chartRes.data?.chart || []);
    } catch (err) {
      console.error("System owner dashboard load error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const money = (v) => (v == null ? "0.00" : Number(v).toFixed(2));

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>System Owner Dashboard</h1>
          <p className={styles.subtitle}>
            Overview of platform performance, subscriptions, and revenue.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* KPI CARDS */}
      {overview && (
        <div className={styles.statsGrid}>
          {[
            ["Companies", overview.totalCompanies, "Active paid tenants"],
            ["Managers", overview.totalManagers, "Store branches"],
            ["Drivers", overview.totalDrivers, "Across all companies"],
            ["Customers", overview.totalCustomers, "Registered users"],
            ["Total Trips", overview.totalTrips, "All-time"],
            ["Trips Today", overview.tripsToday, "Last 24 hours"],
            ["Revenue Today", `$${money(overview.revenueToday)}`, "Paid orders today"],
          ].map(([label, value, hint]) => (
            <div className={styles.card} key={label}>
              <p className={styles.cardLabel}>{label}</p>
              <p className={styles.cardValue}>{value}</p>
              <p className={styles.cardHint}>{hint}</p>
            </div>
          ))}
        </div>
      )}

      {/* MAIN LAYOUT: TABLE + CHART */}
      <div className={styles.bottomLayout}>
        {/* COMPANIES TABLE */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h2>Companies & Subscriptions</h2>
            <p className={styles.cardSub}>
              Auto-calculated subscription tier based on number of drivers.
            </p>
          </div>

          {companies.length === 0 ? (
            <div className={styles.emptyBox}>No companies found yet.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Subscription Tier</th>
                    <th>Price</th>
                    <th>Total Drivers</th>
                    <th>Active Drivers</th>
                    <th>Trips Today</th>
                    <th>Revenue Today</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => {
                    const sub = getSubscriptionTier(c.totalDrivers || 0);

                    return (
                      <tr key={c.companyId}>
                        <td>
                          <div className={styles.companyName}>{c.name}</div>
                          <div className={styles.companyMeta}>
                            Joined: {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td>
                          <span className={styles.subTier}>{sub.tier}</span>
                          {c.isPastDue && (
                            <span className={styles.badgePastDue}>Late</span>
                          )}
                        </td>

                        <td>${sub.price}</td>

                        <td>{c.totalDrivers ?? 0}</td>
                        <td>{c.activeDrivers ?? 0}</td>
                        <td>{c.tripsToday ?? 0}</td>
                        <td>${money(c.totalRevenue)}</td>

                        <td>
                          <span
                            className={
                              c.status === "Suspended"
                                ? styles.statusSuspended
                                : styles.statusActive
                            }
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* REVENUE CHART */}
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h2>Revenue — Last 14 Days</h2>
            <p className={styles.cardSub}>
              Total paid payments from all companies.
            </p>
          </div>

          {chartData.length === 0 ? (
            <div className={styles.emptyBox}>No data yet.</div>
          ) : (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemOwnerDashboard;
