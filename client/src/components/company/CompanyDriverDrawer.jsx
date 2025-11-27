// client/src/components/company/CompanyDriverDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyDriverStatsApi,
  getCompanyDriverRecentTripsApi,
} from "../../api/companyDriversApi";

import styles from "../../styles/company/companyDriverDrawer.module.css";

const CompanyDriverDrawer = ({ open, onClose, driver }) => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && driver?._id) {
      loadDetails(driver._id);
    }
  }, [open, driver]);

  const loadDetails = async (driverId) => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, tripsRes] = await Promise.all([
        getCompanyDriverStatsApi(driverId),
        getCompanyDriverRecentTripsApi(driverId),
      ]);

      if (statsRes.data.ok) setStats(statsRes.data.stats);
      setRecentTrips(tripsRes.data.recentTrips || []);
    } catch (err) {
      console.error("Drawer load error:", err);
      setError("Failed to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !driver) return null;

  const joinedDate = driver.createdAt
    ? new Date(driver.createdAt).toLocaleDateString()
    : "—";

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {/* Title */}
        <h2 className={styles.title}>Driver Details</h2>

        {/* --- DRIVER PROFILE CARD --- */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>
            {driver.name?.charAt(0).toUpperCase() || "D"}
          </div>

          <div className={styles.profileInfo}>
            <h3>{driver.name}</h3>
            <p className={styles.email}>{driver.email}</p>
            <p className={styles.phone}>{driver.phoneNumber || "No phone"}</p>

            <span
              className={
                driver.isActive ? styles.activeBadge : styles.inactiveBadge
              }
            >
              {driver.isActive ? "Active" : "Inactive"}
            </span>

            <p className={styles.joined}>Joined: {joinedDate}</p>
          </div>
        </div>

        {/* Loading state */}
        {loading && <p className={styles.loadingText}>Loading...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {/* --- KPI CARDS --- */}
        {stats && (
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <h4>Total Delivered Trips</h4>
              <p>{stats.totalTrips}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Total Revenue</h4>
              <p>${stats.totalRevenue?.toFixed(2) || "0.00"}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Avg Delivery Time</h4>
              <p>{stats.avgDeliveryTimeMin} min</p>
            </div>
          </div>
        )}

        {/* --- RECENT TRIPS TABLE --- */}
        <div className={styles.section}>
          <h3>Recent Trips</h3>

          {recentTrips.length === 0 ? (
            <p className={styles.empty}>No recent trips.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pickup → Dropoff</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleString()}</td>

                      <td>
                        <div className={styles.route}>
                          <span>{t.pickupAddress || t.pickupLocation?.address}</span>
                          <span className={styles.arrow}>→</span>
                          <span>
                            {t.dropoffAddress || t.dropoffLocation?.address}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            styles[`status_${t.status}`] ||
                            styles.status_default
                          }
                        >
                          {t.status}
                        </span>
                      </td>

                      <td>${t.totalAmount?.toFixed(2) || t.total || "0.00"}</td>
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

export default CompanyDriverDrawer;
