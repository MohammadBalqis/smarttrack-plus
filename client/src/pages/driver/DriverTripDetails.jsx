// client/src/pages/driver/DriverTripDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getDriverTripsApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverTripDetails.module.css";

const DriverTripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      const res = await getDriverTripsApi({ tripId });
      const t = res.data?.trip;
      if (!t) {
        setError("Trip not found.");
      } else {
        setTrip(t);
      }
    } catch (err) {
      console.error(err);
      setError("Could not load trip details.");
    }
  };

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return d.toLocaleString();
  };

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={styles.page}>
        <p className={styles.loadingText}>Loading trip details…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h1 className={styles.title}>Trip Details</h1>
      <p className={styles.subtitle}>View full information for this delivery.</p>

      {/* ============== MAIN CARD ============== */}
      <div className={styles.card}>
        <div className={styles.row}>
          <span className={styles.label}>Trip ID:</span>
          <span className={styles.value}>#{String(trip._id).slice(-6)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Status:</span>
          <span className={styles.status}>{trip.status}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Live Status:</span>
          <span className={styles.value}>{trip.liveStatus || "—"}</span>
        </div>

        <div className={styles.sectionTitle}>Customer Info</div>
        <div className={styles.row}>
          <span className={styles.label}>Name:</span>
          <span className={styles.value}>{trip.customerId?.name || "—"}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Phone:</span>
          <span className={styles.value}>
            {trip.customerId?.phone || trip.customerPhone || "—"}
          </span>
        </div>

        <div className={styles.sectionTitle}>Route</div>
        <div className={styles.row}>
          <span className={styles.label}>Pickup:</span>
          <span className={styles.value}>
            {trip.pickupLocation?.address || "—"}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Dropoff:</span>
          <span className={styles.value}>
            {trip.dropoffLocation?.address || "—"}
          </span>
        </div>

        <div className={styles.sectionTitle}>Payment</div>
        <div className={styles.row}>
          <span className={styles.label}>Delivery Fee:</span>
          <span className={styles.value}>
            {trip.deliveryFee?.toFixed(2)} $
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Total Amount:</span>
          <span className={styles.value}>
            {trip.totalAmount?.toFixed(2)} $
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Payment Status:</span>
          <span className={styles.value}>{trip.paymentStatus}</span>
        </div>

        <div className={styles.sectionTitle}>Dates</div>
        <div className={styles.row}>
          <span className={styles.label}>Created:</span>
          <span className={styles.value}>{formatDate(trip.createdAt)}</span>
        </div>

        {trip.deliveredAt && (
          <div className={styles.row}>
            <span className={styles.label}>Delivered:</span>
            <span className={styles.value}>{formatDate(trip.deliveredAt)}</span>
          </div>
        )}

        <button
          className={styles.liveBtn}
          onClick={() => navigate(`/driver/live-trip?tripId=${trip._id}`)}
        >
          Open Live Trip View
        </button>
      </div>
    </div>
  );
};

export default DriverTripDetails;
