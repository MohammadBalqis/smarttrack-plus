// client/src/components/manager/ManagerDriverDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyDriverStatsApi,
  getCompanyDriverRecentTripsApi,
} from "../../api/companyDriversApi";

import styles from "../../styles/manager/managerDriverDrawer.module.css";

const ManagerDriverDrawer = ({ open, onClose, driver }) => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && driver?._id) loadDetails(driver._id);
  }, [open, driver]);

  const loadDetails = async (driverId) => {
    try {
      setLoading(true);
      const [statsRes, tripsRes] = await Promise.all([
        getCompanyDriverStatsApi(driverId),
        getCompanyDriverRecentTripsApi(driverId),
      ]);

      setStats(statsRes.data.stats || null);
      setRecentTrips(tripsRes.data.recentTrips || []);
    } catch (err) {
      console.error("Drawer load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !driver) return null;

  const joined = driver.createdAt
    ? new Date(driver.createdAt).toLocaleDateString()
    : "—";

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.title}>Driver Details</h2>

        {/* PROFILE */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {driver.name?.charAt(0).toUpperCase()}
          </div>

          <div className={styles.info}>
            <h3>{driver.name}</h3>
            <p>{driver.email}</p>
            <p>{driver.phoneNumber || "No phone"}</p>

            <span
              className={
                driver.isActive ? styles.activeBadge : styles.inactiveBadge
              }
            >
              {driver.isActive ? "Active" : "Inactive"}
            </span>

            <p>Joined: {joined}</p>
          </div>
        </div>

        {loading && <p className={styles.loading}>Loading...</p>}

        {/* KPI */}
        {stats && (
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <h4>Total Trips</h4>
              <p>{stats.totalTrips}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Total Revenue</h4>
              <p>${stats.totalRevenue?.toFixed(2)}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Avg Delivery Time</h4>
              <p>{stats.avgDeliveryTimeMin} min</p>
            </div>
          </div>
        )}

        {/* RECENT TRIPS */}
        <div className={styles.section}>
          <h3>Recent Trips</h3>

          {recentTrips.length === 0 ? (
            <p>No recent trips.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {recentTrips.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.status}</td>
                    <td>${t.totalAmount?.toFixed(2) || "0"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDriverDrawer;
