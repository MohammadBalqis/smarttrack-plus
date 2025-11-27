// client/src/pages/company/CompanyDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyDashboardStatsApi,
  getCompanyDashboardRecentTripsApi,
  getCompanyDashboardRecentOrdersApi,
  getCompanyDashboardRecentPaymentsApi,
} from "../../api/companyDashboardApi";

import { getBrandingApi } from "../../api/brandingApi";
import { useBranding } from "../../context/BrandingContext";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import styles from "../../styles/company/companyDashboard.module.css";

const CompanyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const { branding, updateBranding } = useBranding();

  useEffect(() => {
    loadBranding();
    loadDashboard();
  }, []);

  const loadBranding = async () => {
    try {
      const res = await getBrandingApi();
      updateBranding(res.data.branding);
    } catch (err) {
      console.error("Branding load error:", err);
    }
  };

  const loadDashboard = async () => {
    try {
      const [statsRes, tripsRes, ordersRes, payRes] = await Promise.all([
        getCompanyDashboardStatsApi(),
        getCompanyDashboardRecentTripsApi(),
        getCompanyDashboardRecentOrdersApi(),
        getCompanyDashboardRecentPaymentsApi(),
      ]);

      setStats(statsRes.data.stats);
      setRecentTrips(tripsRes.data.trips);
      setRecentOrders(ordersRes.data.orders);
      setRecentPayments(payRes.data.payments);
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
  };

  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  return (
    <div className={styles.page}>
      <h1 className={styles.title} style={{ color: primary }}>
        Company Dashboard
      </h1>
      <p className={styles.subtitle} style={{ color: accent }}>
        Overview of company activity & performance
      </p>

      {/* KPI CARDS */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h4 style={{ color: primary }}>Total Trips</h4>
          <p>{stats?.totalTrips ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4 style={{ color: primary }}>Delivered Trips</h4>
          <p>{stats?.deliveredTrips ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4 style={{ color: primary }}>Total Orders</h4>
          <p>{stats?.totalOrders ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4 style={{ color: primary }}>Total Payments</h4>
          <p>{stats?.totalPayments ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4 style={{ color: primary }}>Total Drivers</h4>
          <p>{stats?.totalDrivers ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4 style={{ color: primary }}>Total Customers</h4>
          <p>{stats?.totalCustomers ?? 0}</p>
        </div>

        <div className={styles.cardBig}>
          <h4 style={{ color: primary }}>Total Revenue</h4>
          <p style={{ color: accent }}>${(stats?.totalRevenue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* REVENUE CHART */}
      <div className={styles.chartCard}>
        <h3 style={{ color: primary }}>Revenue Trend</h3>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={recentPayments}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="createdAt"
              tickFormatter={(v) => new Date(v).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="totalAmount"
              stroke={accent}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RECENT SECTIONS */}
      <div className={styles.rowsGrid}>
        {/* Recent Trips */}
        <div className={styles.listCard}>
          <h3 style={{ color: primary }}>Recent Trips</h3>
          {recentTrips.length === 0 ? (
            <p className={styles.empty}>No trips yet.</p>
          ) : (
            <ul>
              {recentTrips.map((t) => (
                <li key={t._id}>
                  {t.driverId?.name || "—"} → {t.customerId?.name || "—"}
                  <span>{new Date(t.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Orders */}
        <div className={styles.listCard}>
          <h3 style={{ color: primary }}>Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className={styles.empty}>No orders yet.</p>
          ) : (
            <ul>
              {recentOrders.map((o) => (
                <li key={o._id}>
                  #{o._id.slice(-6)} — {o.status}
                  <span>{new Date(o.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Payments */}
        <div className={styles.listCard}>
          <h3 style={{ color: primary }}>Recent Payments</h3>
          {recentPayments.length === 0 ? (
            <p className={styles.empty}>No payments yet.</p>
          ) : (
            <ul>
              {recentPayments.map((p) => (
                <li key={p._id}>
                  ${p.totalAmount.toFixed(2)}
                  <span>{new Date(p.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
