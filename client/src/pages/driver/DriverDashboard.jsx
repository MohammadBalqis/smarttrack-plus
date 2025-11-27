import React, { useEffect, useState } from "react";
import { getDriverDashboardApi, getDriverRecentTripsApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverDashboard.module.css";

const DriverDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, tripsRes] = await Promise.all([
        getDriverDashboardApi(),
        getDriverRecentTripsApi(),
      ]);

      setStats(statsRes.data.stats);
      setRecentTrips(tripsRes.data.trips);
    } catch (err) {
      console.error("Driver dashboard load failed:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Driver Dashboard</h1>
      <p className={styles.subtitle}>Overview of your daily performance</p>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h4>Total Trips</h4>
          <p>{stats?.totalTrips ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Completed Trips</h4>
          <p>{stats?.completedTrips ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Online Time</h4>
          <p>{stats?.totalOnlineHours ?? 0}h</p>
        </div>

        <div className={styles.card}>
          <h4>Today’s Earnings</h4>
          <p>${(stats?.todayEarnings ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* RECENT TRIPS */}
      <div className={styles.cardLarge}>
        <h3>Recent Trips</h3>

        {recentTrips.length === 0 ? (
          <p>No trips yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Customer</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((t) => (
                <tr key={t._id}>
                  <td>{t._id.slice(-6)}</td>
                  <td>{t.customer?.name}</td>
                  <td>${t.deliveryFee?.toFixed(2)}</td>
                  <td>{t.status}</td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
