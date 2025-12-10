// client/src/pages/driver/DriverDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDriverDashboardApi,
  getDriverRecentTripsApi,
  toggleDriverStatusApi,
} from "../../api/driverApi";

import styles from "../../styles/driver/driverDashboard.module.css";

const DriverDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  const [online, setOnline] = useState(false);
  const [stats, setStats] = useState({
    todayTrips: 0,
    totalTrips: 0,
    todayEarnings: 0,
    totalEarnings: 0,
  });

  const [recentTrips, setRecentTrips] = useState([]);

  /* ==========================================
     LOAD DASHBOARD STATS
  ========================================== */
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getDriverDashboardApi();
      const payload =
        res.data?.dashboard || res.data?.stats || res.data || {};

      setOnline(
        payload.isOnline !== undefined
          ? payload.isOnline
          : payload.status === "online"
      );

      setStats({
        todayTrips: payload.todayTrips ?? payload.tripsToday ?? 0,
        totalTrips: payload.totalTrips ?? payload.tripsTotal ?? 0,
        todayEarnings:
          payload.todayEarnings ?? payload.earningsToday ?? 0,
        totalEarnings:
          payload.totalEarnings ?? payload.earningsTotal ?? 0,
      });
    } catch (err) {
      console.error("Driver dashboard load error:", err);
      const msg =
        err?.response?.data?.error ||
        "Failed to load dashboard. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     LOAD RECENT TRIPS
  ========================================== */
  const loadRecentTrips = async () => {
    try {
      const res = await getDriverRecentTripsApi();
      const list =
        res.data?.trips || res.data?.recentTrips || res.data || [];
      setRecentTrips(Array.isArray(list) ? list.slice(0, 5) : []);
    } catch (err) {
      console.error("Driver recent trips error:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadRecentTrips();
  }, []);

  /* ==========================================
     TOGGLE ONLINE / OFFLINE
  ========================================== */
  const handleToggleStatus = async () => {
    try {
      setToggling(true);
      setError("");

      const res = await toggleDriverStatusApi();
      const nextOnline =
        res.data?.isOnline !== undefined
          ? res.data.isOnline
          : !online;

      setOnline(nextOnline);
    } catch (err) {
      console.error("Toggle driver status error:", err);
      const msg =
        err?.response?.data?.error ||
        "Could not change status. Please try again.";
      setError(msg);
    } finally {
      setToggling(false);
    }
  };

  const formatMoney = (v) => {
    if (v == null) return "0.00";
    return Number(v).toFixed(2);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  /* ==========================================
     RENDER
  ========================================== */

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Driver Dashboard</h1>
          <p className={styles.subtitle}>
            Quick view of your status, trips, and earnings.
          </p>
        </div>

        <div className={styles.statusBox}>
          <span
            className={`${styles.statusPill} ${
              online ? styles.statusOnline : styles.statusOffline
            }`}
          >
            {online ? "Online" : "Offline"}
          </span>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={handleToggleStatus}
            disabled={toggling}
          >
            {toggling
              ? "Updating..."
              : online
              ? "Go Offline"
              : "Go Online"}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {loading && (
        <p className={styles.infoText}>Loading dashboard...</p>
      )}

      {/* STATS CARDS */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <p className={styles.cardTitle}>Trips Today</p>
          <p className={styles.cardValue}>{stats.todayTrips}</p>
          <p className={styles.cardSub}>
            Total trips: {stats.totalTrips}
          </p>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>Earnings Today</p>
          <p className={styles.cardValue}>
            {formatMoney(stats.todayEarnings)} $
          </p>
          <p className={styles.cardSub}>
            Total: {formatMoney(stats.totalEarnings)} $
          </p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick actions</h2>
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate("/driver/trips")}
          >
            View all trips
          </button>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate("/driver/live-trip")}
          >
            Open live trip
          </button>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate("/driver/scan-qr")}
          >
            Scan customer QR
          </button>

          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => navigate("/driver/payments")}
          >
            My payments
          </button>
        </div>
      </div>

      {/* RECENT TRIPS WIDGET */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent trips</h2>

        {recentTrips.length === 0 ? (
          <p className={styles.infoText}>
            No recent trips found.
          </p>
        ) : (
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Status</th>
                  <th>Customer</th>
                  <th>Fee</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((trip) => (
                  <tr key={trip._id}>
                    <td>#{String(trip._id).slice(-6)}</td>
                    <td>{trip.status}</td>
                    <td>{trip.customerId?.name || "—"}</td>
                    <td>
                      {formatMoney(trip.deliveryFee)}{" "}
                      <span className={styles.muted}>
                        {trip.currency || "USD"}
                      </span>
                    </td>
                    <td>{formatDateTime(trip.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() =>
                          navigate(
                            `/driver/live-trip?tripId=${trip._id}`
                          )
                        }
                      >
                        View / Live
                      </button>
                    </td>
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

export default DriverDashboard;
