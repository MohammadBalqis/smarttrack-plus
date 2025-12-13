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
   SUBSCRIPTION TIER (BASED ON VERIFIED DRIVERS)
========================================================== */
const getSubscriptionTier = (verifiedDrivers = 0) => {
  if (verifiedDrivers <= 10) return { tier: "Basic", price: 50 };
  if (verifiedDrivers <= 30) return { tier: "Standard", price: 80 };
  if (verifiedDrivers <= 50) return { tier: "Pro", price: 100 };
  return { tier: "Enterprise", price: 150 };
};

const SystemOwnerDashboard = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [chartMode, setChartMode] = useState("revenue");
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
    if (filter === "suspended")
      return companies.filter((c) => c.status === "Suspended");
    return companies;
  }, [companies, filter]);

  /* ================= CSV EXPORT ================= */
  const exportCSV = () => {
    const rows = [
      [
        "Company",
        "Verified Drivers",
        "Max Drivers",
        "Tier",
        "Price",
        "Status",
      ],
      ...filteredCompanies.map((c) => {
        const t = getSubscriptionTier(c.verifiedDrivers);
        return [
          c.name,
          c.verifiedDrivers,
          c.maxDrivers,
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

  if (loading) {
    return <div className={styles.loading}>Loading dashboard…</div>;
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>System Owner Dashboard</h1>
        <div className={styles.headerActions}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Companies</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <button onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className={styles.kpis}>
        <div className={styles.kpi}>
          Companies <span>{overview.totalCompanies}</span>
        </div>

        <div className={styles.kpi}>
          Verified Drivers <span>{overview.totalDrivers}</span>
        </div>

        <div className={styles.kpi}>
          Trips <span>{overview.totalTrips}</span>
        </div>

        <div className={styles.kpi}>
          Revenue Today <span>${overview.revenueToday}</span>
        </div>
      </div>

      {/* COMPANIES TABLE */}
      <div className={styles.card}>
        <h2>Companies</h2>

        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Drivers</th>
              <th>Tier</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredCompanies.map((c) => {
              const tier = getSubscriptionTier(c.verifiedDrivers);

              return (
                <tr
                  key={c.companyId}
                  onClick={() =>
                    navigate(`/owner/companies/${c.companyId}`)
                  }
                >
                  <td>{c.name}</td>

                  <td>
                    <strong>{c.verifiedDrivers}</strong>
                    {typeof c.maxDrivers === "number" && (
                      <span className={styles.muted}>
                        {" "}
                        / {c.maxDrivers}
                      </span>
                    )}
                    {c.pendingDrivers > 0 && (
                      <span className={styles.pendingHint}>
                        {" "}
                        (+{c.pendingDrivers} pending)
                      </span>
                    )}
                  </td>

                  <td>
                    {tier.tier} (${tier.price})
                  </td>

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
            <button onClick={() => setChartMode("revenue")}>
              Revenue
            </button>
            <button onClick={() => setChartMode("trips")}>
              Trips
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
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
    </div>
  );
};

export default SystemOwnerDashboard;
