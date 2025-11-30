// client/src/pages/customer/CustomerTrips.jsx
import React, { useEffect, useState } from "react";
import {
  getCustomerActiveTripsApi,
  getCustomerTripDetailsApi,
} from "../../api/customerTripsApi";
import CustomerTripDrawer from "../../components/customer/CustomerTripDrawer";

import { useNavigate } from "react-router-dom";
import styles from "../../styles/customer/trips.module.css";

const CustomerTrips = () => {
  const navigate = useNavigate();

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
      setSelectedTrip(res.data.trip);
      setDrawerOpen(true);
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
      <p className={styles.info}>
        No active trips. Create a delivery order to get started.
      </p>
    );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Active Orders</h1>
      <p className={styles.sub}>
        Track your pending and in-progress deliveries.
      </p>

      <div className={styles.grid}>
        {trips.map((trip) => (
          <div key={trip._id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>#{String(trip._id).slice(-6)}</h3>
              <span
                className={
                  styles[`statusBadge_${trip.status}`] ||
                  styles.statusBadge_default
                }
              >
                {trip.status}
              </span>
            </div>

            <p className={styles.line}>
              <strong>Pickup:</strong> {trip.pickupLocation.address}
            </p>
            <p className={styles.line}>
              <strong>Dropoff:</strong> {trip.dropoffLocation.address}
            </p>

            {trip.driverId && (
              <p className={styles.line}>
                <strong>Driver:</strong> {trip.driverId.name}
              </p>
            )}

            {/* VIEW DETAILS */}
            <button
              className={styles.viewBtn}
              onClick={() => openDrawer(trip._id)}
            >
              View Details
            </button>

            {/* NEW: TRACK ORDER */}
            {["pending", "assigned", "in_progress"].includes(trip.status) && (
              <button
                className={styles.trackBtn}
                onClick={() =>
                  navigate(`/customer/trips/track/${trip._id}`)
                }
              >
                Track Live
              </button>
            )}
          </div>
        ))}
      </div>

      {/* DRAWER */}
      <CustomerTripDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        trip={selectedTrip}
      />
    </div>
  );
};

export default CustomerTrips;
