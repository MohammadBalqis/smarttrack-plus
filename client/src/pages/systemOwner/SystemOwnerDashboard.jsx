// client/src/pages/owner/SystemOwnerDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
   SUBSCRIPTION TIER
========================================================== */
const getSubscriptionTier = (drivers = 0) => {
  if (drivers <= 10) return { tier: "Basic", price: 50 };
  if (drivers <= 30) return { tier: "Standard", price: 80 };
  if (drivers <= 50) return { tier: "Pro", price: 100 };
  return { tier: "Enterprise", price: 150 };
};

const SystemOwnerDashboard = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("revenue"); // revenue | trips
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    setLoading(true);
    const [ov, comp, chart] = await Promise.all([
      getOwnerOverviewApi(),
      getOwnerCompaniesActivityApi(),
      getOwnerRevenueChartApi(),
    ]);

    setOverview(ov.data);
    setCompanies(comp.data.companies || []);
    setChartData(chart.data.chart || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= FILTER ================= */
  const filteredCompanies = useMemo(() => {
    if (filter === "active")
      return companies.filter((c) => c.status === "Active");
    if (filter === "late")
      return companies.filter((c) => c.isPastDue);
    if (filter === "suspended")
      return companies.filter((c) => c.status === "Suspended");
    return companies;
  }, [companies, filter]);

  /* ================= CSV EXPORT ================= */
  const exportCSV = () => {
    const rows = [
      [
        "Company",
        "Drivers",
        "Active Drivers",
        "Tier",
        "Price",
        "Status",
      ],
      ...filteredCompanies.map((c) => {
        const t = getSubscriptionTier(c.totalDrivers);
        return [
          c.name,
          c.totalDrivers,
          c.activeDrivers,
          t.tier,
          t.price,
          c.status,
        ];
      }),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "companies.csv";
    a.click();
  };

  /* ================= WIDGETS ================= */
  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const topCompanies = [...companies]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  if (loading) return <div className={styles.loading}>Loading dashboard…</div>;

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>System Owner Dashboard</h1>
        <div className={styles.headerActions}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Companies</option>
            <option value="active">Active</option>
            <option value="late">Past Due</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>Companies <span>{overview.totalCompanies}</span></div>
        <div className={styles.kpi}>Drivers <span>{overview.totalDrivers}</span></div>
        <div className={styles.kpi}>Trips <span>{overview.totalTrips}</span></div>
        <div className={styles.kpi}>Revenue Today <span>${overview.revenueToday}</span></div>
      </div>

      {/* TABLE */}
      <div className={styles.card}>
        <h2>Companies</h2>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Drivers</th>
              <th>Tier</th>
              <th>Revenue</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((c) => {
              const t = getSubscriptionTier(c.totalDrivers);
              return (
                <tr
                  key={c.companyId}
                  onClick={() => navigate(`/owner/companies/${c.companyId}`)}
                >
                  <td>{c.name}</td>
                  <td>{c.totalDrivers}</td>
                  <td>{t.tier} (${t.price})</td>
                  <td>${c.totalRevenue}</td>
                  <td className={styles[c.status.toLowerCase()]}>
                    {c.status}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* CHART */}
      <div className={styles.card}>
        <div className={styles.chartHeader}>
          <h2>Last 14 Days</h2>
          <div>
            <button onClick={() => setChartMode("revenue")}>Revenue</button>
            <button onClick={() => setChartMode("trips")}>Trips</button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={chartMode === "revenue" ? "total" : "trips"}
              stroke="#38bdf8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* WIDGETS */}
      <div className={styles.widgets}>
        <div className={styles.widget}>
          <h3>Recently Joined</h3>
          {recentCompanies.map((c) => (
            <div key={c.companyId}>{c.name}</div>
          ))}
        </div>

        <div className={styles.widget}>
          <h3>Top Revenue</h3>
          {topCompanies.map((c) => (
            <div key={c.companyId}>
              {c.name} — ${c.totalRevenue}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemOwnerDashboard;
