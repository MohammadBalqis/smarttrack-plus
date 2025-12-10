import React, { useEffect, useState } from "react";
import {
  getDriverActiveTripApi,
  updateDriverTripStatusApi,
} from "../../api/driverApi";
import { useNavigate } from "react-router-dom";

import styles from "../../styles/driver/driverDashboard.module.css";

const ActiveTripCard = () => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadActiveTrip = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDriverActiveTripApi();
      setTrip(res.data.trip || null);
    } catch (err) {
      console.error("Failed to load active trip:", err);
      setError(
        err.response?.data?.error || "Could not load active trip right now."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTrip();
  }, []);

  const quickUpdateStatus = async (status, liveStatus) => {
    if (!trip?._id) return;
    try {
      setUpdating(true);
      setError("");

      const res = await updateDriverTripStatusApi(trip._id, {
        status,
        liveStatus,
      });

      setTrip(res.data.trip);
    } catch (err) {
      console.error("Update status failed:", err);
      setError(
        err.response?.data?.error || "Could not update trip status right now."
      );
    } finally {
      setUpdating(false);
    }
  };

  const goToQrScan = () => {
    navigate("/driver/scan-qr");
  };

  if (loading) {
    return (
      <div className={styles.activeCard}>
        <p className={styles.muted}>Loading active trip...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className={styles.activeCard}>
        <div className={styles.activeHeader}>
          <h3>Active Trip</h3>
        </div>
        <p className={styles.muted}>No active trip at the moment.</p>
      </div>
    );
  }

  const statusLabel = trip.status || "pending";

  return (
    <div className={styles.activeCard}>
      <div className={styles.activeHeader}>
        <div>
          <h3>Active Trip</h3>
          <p className={styles.activeSubtitle}>
            Trip #{String(trip._id).slice(-6)}
          </p>
        </div>
        <span
          className={`${styles.activeStatusPill} ${styles[statusLabel] || ""}`}
        >
          {statusLabel}
        </span>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.activeInfo}>
        <div>
          <span className={styles.label}>Customer</span>
          <p className={styles.value}>
            {trip.customerId?.name || "—"}{" "}
            {trip.customerId?.phone && `(${trip.customerId.phone})`}
          </p>
        </div>

        <div>
          <span className={styles.label}>Pickup</span>
          <p className={styles.value}>
            {trip.pickupLocation?.address || "—"}
          </p>
        </div>

        <div>
          <span className={styles.label}>Dropoff</span>
          <p className={styles.value}>
            {trip.dropoffLocation?.address || "—"}
          </p>
        </div>

        <div>
          <span className={styles.label}>Delivery fee</span>
          <p className={styles.value}>
            {trip.deliveryFee?.toFixed(2)} $
          </p>
        </div>
      </div>

      <p className={styles.muted}>
        Live status: <strong>{trip.liveStatus || "—"}</strong>
      </p>

      <div className={styles.controlRow}>
        {trip.status === "assigned" && (
          <>
            <button
              type="button"
              disabled={updating}
              className={styles.controlButton}
              onClick={() =>
                quickUpdateStatus("in_progress", "On the way to customer")
              }
            >
              {updating ? "Updating..." : "Start Trip"}
            </button>

            <button
              type="button"
              disabled={updating}
              className={styles.controlButtonSecondary}
              onClick={() =>
                quickUpdateStatus("cancelled", "Trip cancelled by driver")
              }
            >
              Cancel Trip
            </button>
          </>
        )}

        {trip.status === "in_progress" && (
          <>
            <button
              type="button"
              disabled={updating}
              className={styles.controlButton}
              onClick={goToQrScan}
            >
              Scan QR to Confirm
            </button>

            <button
              type="button"
              disabled={updating}
              className={styles.controlButtonSecondary}
              onClick={() =>
                quickUpdateStatus(
                  "delivered",
                  "Delivered (driver manually confirmed)"
                )
              }
            >
              Mark Delivered (No QR)
            </button>
          </>
        )}

        {["delivered", "cancelled"].includes(trip.status) && (
          <p className={styles.muted}>
            This trip is already <strong>{trip.status}</strong>.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActiveTripCard;
