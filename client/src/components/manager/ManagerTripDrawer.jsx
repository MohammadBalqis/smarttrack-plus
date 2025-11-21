import React, { useState } from "react";
import { assignTripDriverApi } from "../../api/companyTripsApi";
import styles from "../../styles/manager/managerTrips.module.css";

const ManagerTripDrawer = ({ open, onClose, trip, drivers, onTripUpdated }) => {
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleAssign = async () => {
    if (!trip || !selectedDriverId) {
      setError("Please select a driver.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const res = await assignTripDriverApi(trip._id, selectedDriverId);
      const updatedTrip = res.data.trip;
      onTripUpdated(updatedTrip);
    } catch (err) {
      console.error("Error assigning driver:", err);
      const msg =
        err.response?.data?.error || "Failed to assign/reassign driver.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const currentDriverName = trip?.driverId?.name || "Unassigned";

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {!trip ? (
          <p>Loading trip...</p>
        ) : (
          <>
            <h2 className={styles.drawerTitle}>Trip Details</h2>

            {/* Trip info */}
            <div className={styles.section}>
              <h4>Current Driver</h4>
              <p>{currentDriverName}</p>
            </div>

            <div className={styles.section}>
              <h4>Pickup</h4>
              <p>{trip.pickupLocation?.address}</p>
            </div>

            <div className={styles.section}>
              <h4>Dropoff</h4>
              <p>{trip.dropoffLocation?.address}</p>
            </div>

            <div className={styles.section}>
              <h4>Customer</h4>
              <p>{trip.customerId?.name || "—"}</p>
            </div>

            <div className={styles.section}>
              <h4>Items</h4>
              {trip.orderItems?.length === 0 && <p>No items</p>}
              {trip.orderItems?.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} × ${item.price}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h4>Total Amount</h4>
              <p className={styles.totalAmount}>
                ${trip.totalAmount?.toFixed(2) || "0.00"}
              </p>
            </div>

            <div className={styles.section}>
              <h4>Status</h4>
              <span
                className={
                  styles[`badge_${trip.status}`] || styles.badge_default
                }
              >
                {trip.status}
              </span>
            </div>

            {/* Assign / reassign */}
            <div className={styles.section}>
              <h4>Assign / Change Driver</h4>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className={styles.select}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.email})
                  </option>
                ))}
              </select>

              {error && <p className={styles.error}>{error}</p>}

              <button
                className={styles.primaryBtn}
                onClick={handleAssign}
                disabled={saving}
              >
                {saving ? "Assigning..." : "Assign / Reassign Driver"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerTripDrawer;
