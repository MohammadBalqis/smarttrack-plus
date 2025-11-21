import React, { useEffect, useState } from "react";
import { getCompanyDashboardStatsApi } from "../../api/companyDashboardApi";
import { getCompanyTripsApi } from "../../api/companyTripsApi";
import styles from "../../styles/manager/managerDashboard.module.css";

const ManagerDashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [tripCounts, setTripCounts] = useState({
    pending: 0,
    assigned: 0,
    inProgress: 0,
  });
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statsRes,
        pendingRes,
        assignedRes,
        inProgressRes,
        activeRes,
      ] = await Promise.all([
        getCompanyDashboardStatsApi(),
        getCompanyTripsApi({ status: "pending", page: 1, limit: 1 }),
        getCompanyTripsApi({ status: "assigned", page: 1, limit: 1 }),
        getCompanyTripsApi({ status: "in_progress", page: 1, limit: 1 }),
        getCompanyTripsApi({ status: "in_progress", page: 1, limit: 5 }),
      ]);

      if (statsRes.data.ok) {
        setKpis(statsRes.data.kpis);
      }

      setTripCounts({
        pending: pendingRes.data.total || 0,
        assigned: assignedRes.data.total || 0,
        inProgress: inProgressRes.data.total || 0,
      });

      setActiveTrips(activeRes.data.trips || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load manager dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const base = styles.statusBadge;
    if (status === "pending")
      return <span className={`${base} ${styles.statusPending}`}>Pending</span>;
    if (status === "assigned")
      return (
        <span className={`${base} ${styles.statusAssigned}`}>Assigned</span>
      );
    if (status === "in_progress")
      return (
        <span className={`${base} ${styles.statusInProgress}`}>In Progress</span>
      );
    if (status === "delivered")
      return (
        <span className={`${base} ${styles.statusDelivered}`}>Delivered</span>
      );
    if (status === "cancelled")
      return (
        <span className={`${base} ${styles.statusCancelled}`}>Cancelled</span>
      );
    return <span className={base}>{status}</span>;
  };

  if (loading) {
    return <div className={styles.loading}>Loading manager dashboard...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!kpis) {
    return <div className={styles.error}>No data available.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manager Dashboard</h1>

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h3>Total Trips</h3>
          <p className={styles.number}>{kpis.totalTrips}</p>
          <span className={styles.subText}>All delivered trips</span>
        </div>

        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>
            ${kpis.totalRevenue?.toFixed(2) || "0.00"}
          </p>
          <span className={styles.subText}>From delivered trips</span>
        </div>

        <div className={styles.card}>
          <h3>Trips Today</h3>
          <p className={styles.number}>{kpis.tripsToday}</p>
          <span className={styles.subText}>Delivered today</span>
        </div>

        <div className={styles.card}>
          <h3>Revenue Today</h3>
          <p className={styles.number}>
            ${kpis.revenueToday?.toFixed(2) || "0.00"}
          </p>
          <span className={styles.subText}>Today&apos;s earnings</span>
        </div>

        <div className={styles.card}>
          <h3>Pending Trips</h3>
          <p className={styles.number}>{tripCounts.pending}</p>
          <span className={styles.subText}>Waiting for assignment</span>
        </div>

        <div className={styles.card}>
          <h3>Assigned Trips</h3>
          <p className={styles.number}>{tripCounts.assigned}</p>
          <span className={styles.subText}>Driver assigned</span>
        </div>

        <div className={styles.card}>
          <h3>In Progress</h3>
          <p className={styles.number}>{tripCounts.inProgress}</p>
          <span className={styles.subText}>On the road now</span>
        </div>
      </div>

      {/* Active Trips Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Active Trips (In Progress)</h3>
        </div>

        {activeTrips.length === 0 ? (
          <p className={styles.empty}>No active trips at the moment.</p>
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
                {activeTrips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td>{t.driverId?.name || "Unassigned"}</td>
                    <td>{t.pickupLocation?.address}</td>
                    <td>{t.dropoffLocation?.address}</td>
                    <td>{renderStatusBadge(t.status)}</td>
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

export default ManagerDashboard;
