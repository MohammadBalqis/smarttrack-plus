import React, { useEffect, useState } from "react";
import {
  getCompanyDriverStatsApi,
  getCompanyDriverRecentTripsApi,
} from "../../api/companyDriversApi";
import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDriverDrawer = ({ open, onClose, driver }) => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && driver?._id) {
      loadData(driver._id);
    }
  }, [open, driver]);

  const loadData = async (driverId) => {
    try {
      setLoading(true);
      setError("");
      const [statsRes, tripsRes] = await Promise.all([
        getCompanyDriverStatsApi(driverId),
        getCompanyDriverRecentTripsApi(driverId),
      ]);

      if (statsRes.data.ok) {
        setStats(statsRes.data.stats || null);
      }
      setRecentTrips(tripsRes.data.trips || []);
    } catch (err) {
      console.error("Error loading driver drawer data:", err);
      setError("Failed to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !driver) return null;

  const joinedAt =
    driver.createdAt && !isNaN(Date.parse(driver.createdAt))
      ? new Date(driver.createdAt).toLocaleDateString()
      : "—";

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.drawerTitle}>Driver Details</h2>

        {/* Driver info card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarCircle}>
            {driver.name?.charAt(0).toUpperCase() || "D"}
          </div>
          <div>
            <h3 className={styles.driverName}>{driver.name}</h3>
            <p className={styles.driverEmail}>{driver.email}</p>
            <p className={styles.driverPhone}>
              {driver.phoneNumber || "No phone set"}
            </p>
            <span
              className={
                driver.isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive
              }
            >
              {driver.isActive ? "Active" : "Inactive"}
            </span>
            <p className={styles.joinedText}>Joined: {joinedAt}</p>
          </div>
        </div>

        {loading && <p className={styles.smallInfo}>Loading stats...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {/* KPI cards */}
        {stats && (
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <h4>Total Trips</h4>
              <p>{stats.totalTrips}</p>
            </div>
            <div className={styles.kpiCard}>
              <h4>Delivered</h4>
              <p>{stats.deliveredTrips}</p>
            </div>
            <div className={styles.kpiCard}>
              <h4>Active Trips</h4>
              <p>{stats.activeTripsCount}</p>
            </div>
            <div className={styles.kpiCard}>
              <h4>Revenue</h4>
              <p>${stats.revenueGenerated?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        )}

        {/* Recent trips */}
        <div className={styles.section}>
          <h3>Recent Trips</h3>
          {recentTrips.length === 0 ? (
            <p className={styles.empty}>No trips for this driver yet.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleString()
                          : ""}
                      </td>
                      <td>{t.customerName}</td>
                      <td>
                        <div className={styles.routeText}>
                          <span>{t.pickupAddress}</span>
                          <span className={styles.routeArrow}>→</span>
                          <span>{t.dropoffAddress}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            styles[`badge_${t.status}`] ||
                            styles.badge_default
                          }
                        >
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
    </div>
  );
};

export default ManagerDriverDrawer;
