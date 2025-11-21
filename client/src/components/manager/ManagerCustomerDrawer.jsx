// src/components/manager/ManagerCustomerDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyCustomerStatsApi,
  getCompanyCustomerRecentTripsApi,
} from "../../api/companyCustomersApi";

import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomerDrawer = ({ open, onClose, customer }) => {
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && customer?.customerId) {
      loadData(customer.customerId);
    }
  }, [open, customer]);

  const loadData = async (customerId) => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, tripsRes] = await Promise.all([
        getCompanyCustomerStatsApi(customerId),
        getCompanyCustomerRecentTripsApi(customerId),
      ]);

      if (statsRes.data.ok) {
        setStats(statsRes.data.stats);
      }

      setRecentTrips(tripsRes.data.trips || []);
    } catch (err) {
      console.error("Drawer load error:", err);
      setError("Failed to load customer details.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !customer) return null;

  const joinedDate =
    customer.createdAt && !isNaN(Date.parse(customer.createdAt))
      ? new Date(customer.createdAt).toLocaleDateString()
      : "—";

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.drawerTitle}>Customer Details</h2>

        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarCircle}>
            {customer.name?.charAt(0).toUpperCase() || "C"}
          </div>
          <div>
            <h3 className={styles.customerName}>{customer.name}</h3>
            <p className={styles.customerEmail}>{customer.email}</p>
            <p className={styles.customerPhone}>
              {customer.phoneNumber || "No phone available"}
            </p>

            <span
              className={
                customer.isActive
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive
              }
            >
              {customer.isActive ? "Active" : "Inactive"}
            </span>

            <p className={styles.joinedText}>Joined: {joinedDate}</p>
          </div>
        </div>

        {loading && <p className={styles.smallInfo}>Loading stats...</p>}
        {error && <p className={styles.error}>{error}</p>}

        {/* KPI Cards */}
        {stats && (
          <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
              <h4>Total Trips</h4>
              <p>{stats.totalTrips}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Delivered Trips</h4>
              <p>{stats.deliveredTrips}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Cancelled Trips</h4>
              <p>{stats.cancelledTrips}</p>
            </div>

            <div className={styles.kpiCard}>
              <h4>Total Spent</h4>
              <p>${stats.totalSpent?.toFixed(2) || "0.00"}</p>
            </div>
          </div>
        )}

        {/* Recent Trips */}
        <div className={styles.section}>
          <h3>Recent Trips</h3>

          {recentTrips.length === 0 ? (
            <p className={styles.empty}>No trips yet for this customer.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Driver</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrips.map((t) => (
                    <tr key={t.id}>
                      <td>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>

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

                      <td>{t.driverName}</td>

                      <td>
                        <span
                          className={
                            t.paymentStatus === "paid"
                              ? styles.statusPaid
                              : t.paymentStatus === "pending"
                              ? styles.statusPending
                              : styles.statusUnpaid
                          }
                        >
                          {t.paymentStatus}
                        </span>
                      </td>
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

export default ManagerCustomerDrawer;
