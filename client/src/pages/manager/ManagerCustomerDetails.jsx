import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getManagerCustomerDetailsApi } from "../../api/managerCustomerApi";
import styles from "../../styles/manager/customerDetails.module.css";

const ManagerCustomerDetails = () => {
  const { customerId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getManagerCustomerDetailsApi(customerId);
      setData(res.data);
    } catch (err) {
      console.error("Error loading customer details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  if (loading) return <p className={styles.info}>Loading customer…</p>;
  if (!data) return <p className={styles.info}>Customer not found.</p>;

  const { customer, stats, recentTrips } = data;

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{customer.name}</h1>
          <p className={styles.subtitle}>Customer profile & trip history</p>
        </div>
        <Link to="/manager/customers" className={styles.backLink}>
          ← Back to customers
        </Link>
      </div>

      {/* Top section: profile + stats */}
      <div className={styles.topGrid}>
        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileHeader}>
            {customer.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${customer.avatar}`}
                alt={customer.name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarBigPlaceholder}>
                {customer.name?.charAt(0)?.toUpperCase() || "C"}
              </div>
            )}
            <div>
              <div className={styles.customerName}>{customer.name}</div>
              <div className={styles.customerEmail}>{customer.email}</div>
              <div className={styles.customerPhone}>
                {customer.phone || "No phone"}
              </div>
              <div
                className={
                  customer.isActive ? styles.badgeActive : styles.badgeInactive
                }
              >
                {customer.isActive ? "Active" : "Blocked"}
              </div>
            </div>
          </div>

          <div className={styles.metaRow}>
            <span>Customer since:</span>
            <strong>
              {customer.createdAt
                ? new Date(customer.createdAt).toLocaleDateString()
                : "—"}
            </strong>
          </div>
        </div>

        {/* Stats card */}
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Trip Statistics</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span>Total Trips</span>
              <strong>{stats.totalTrips}</strong>
            </div>
            <div className={styles.statBox}>
              <span>Delivered</span>
              <strong>{stats.deliveredTrips}</strong>
            </div>
            <div className={styles.statBox}>
              <span>Cancelled</span>
              <strong>{stats.cancelledTrips}</strong>
            </div>
            <div className={styles.statBox}>
              <span>Total Spent</span>
              <strong>${(stats.totalAmount || 0).toFixed(2)}</strong>
            </div>
            <div className={styles.statBox}>
              <span>First Trip</span>
              <strong>
                {stats.firstTripAt
                  ? new Date(stats.firstTripAt).toLocaleDateString()
                  : "—"}
              </strong>
            </div>
            <div className={styles.statBox}>
              <span>Last Trip</span>
              <strong>
                {stats.lastTripAt
                  ? new Date(stats.lastTripAt).toLocaleString()
                  : "—"}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recent trips table */}
      <div className={styles.card}>
        <div className={styles.cardHeaderRow}>
          <h3 className={styles.cardTitle}>Recent Trips</h3>
          <span className={styles.cardHint}>
            Showing latest {recentTrips.length} trips with this customer.
          </span>
        </div>

        {recentTrips.length === 0 ? (
          <p className={styles.info}>No trips for this customer yet.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Pickup</th>
                  <th>Dropoff</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.pickupLocation?.address || "—"}</td>
                    <td>{t.dropoffLocation?.address || "—"}</td>
                    <td>{t.driverId?.name || "—"}</td>
                    <td>
                      {t.vehicleId
                        ? `${t.vehicleId.brand} ${t.vehicleId.model} (${t.vehicleId.plateNumber})`
                        : "—"}
                    </td>
                    <td>
                      $
                      {(
                        (t.totalAmount || 0) +
                        (t.deliveryFee || 0)
                      ).toFixed(2)}
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

export default ManagerCustomerDetails;
