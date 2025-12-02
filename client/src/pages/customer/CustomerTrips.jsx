// client/src/pages/customer/CustomerTrips.jsx
import React, { useEffect, useState } from "react";
import {
  getCustomerActiveTripsApi,
  getCustomerTripDetailsApi,
} from "../../api/customerTripsApi";

import CustomerTripDrawer from "../../components/customer/CustomerTripDrawer";
import styles from "../../styles/customer/trips.module.css";

const CustomerTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const res = await getCustomerActiveTripsApi();
      if (res.data.ok) {
        setTrips(res.data.trips || []);
      } else {
        setError("Failed to load active trips.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading trips.");
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (tripId) => {
    try {
      const res = await getCustomerTripDetailsApi(tripId);
      if (res.data?.ok && res.data.trip) {
        setSelectedTrip(res.data.trip);
        setDrawerOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  if (loading) return <p className={styles.info}>Loading active orders…</p>;

  if (error) return <p className={styles.error}>{error}</p>;

  if (trips.length === 0)
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Active Orders</h1>
        <p className={styles.sub}>Track your pending and in-progress orders.</p>

        <p className={styles.info}>You currently have no active trips.</p>
      </div>
    );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Active Orders</h1>
      <p className={styles.sub}>Track your pending and in-progress deliveries.</p>

      <div className={styles.grid}>
        {trips.map((trip) => {
          const badgeClass =
            styles[`statusBadge_${trip.status}`] ||
            styles.statusBadge_default;

          return (
            <div key={trip._id} className={styles.card}>
              {/* Header */}
              <div className={styles.cardHeader}>
                <h3>#{String(trip._id).slice(-6)}</h3>
                <span className={badgeClass}>
                  {trip.status === "in_progress"
                    ? "In Progress"
                    : trip.status.charAt(0).toUpperCase() +
                      trip.status.slice(1)}
                </span>
              </div>

              {/* Addresses */}
              <p className={styles.line}>
                <strong>Pickup:</strong> {trip.pickupLocation?.address}
              </p>

              <p className={styles.line}>
                <strong>Dropoff:</strong> {trip.dropoffLocation?.address}
              </p>

              {/* Driver */}
              {trip.driverId && (
                <p className={styles.line}>
                  <strong>Driver:</strong> {trip.driverId.name}
                </p>
              )}

              {/* Track button */}
              <button
                className={styles.trackBtn}
                onClick={() => openDrawer(trip._id)}
              >
                Track Order
              </button>
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      <CustomerTripDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTrip(null);
        }}
        trip={selectedTrip}
      />
    </div>
  );
};

export default CustomerTrips;
