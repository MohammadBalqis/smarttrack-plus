// client/src/pages/customer/CustomerTripHistory.jsx
import React, { useEffect, useState } from "react";
import {
  getCustomerHistoryTripsApi,
  getCustomerTripDetailsApi,
} from "../../api/customerTripsApi";

import CustomerTripDrawer from "../../components/customer/CustomerTripDrawer";
import styles from "../../styles/customer/trips.module.css";

const CustomerTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const res = await getCustomerHistoryTripsApi();
      if (res.data.ok) {
        setTrips(res.data.trips || []);
        setFiltered(res.data.trips || []);
      } else {
        setError("Failed to load history.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const applyFilter = (value) => {
    setFilter(value);

    if (value === "all") return setFiltered(trips);

    if (value === "delivered") {
      return setFiltered(trips.filter((t) => t.status === "delivered"));
    }

    if (value === "cancelled") {
      return setFiltered(trips.filter((t) => t.status === "cancelled"));
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

  if (loading) return <p className={styles.info}>Loading history…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Trip History</h1>
      <p className={styles.sub}>All your completed and cancelled orders.</p>

      {/* FILTERS */}
      <div className={styles.filterRow}>
        <button
          className={filter === "all" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("all")}
        >
          All
        </button>

        <button
          className={
            filter === "delivered" ? styles.filterActive : styles.filterBtn
          }
          onClick={() => applyFilter("delivered")}
        >
          Delivered
        </button>

        <button
          className={
            filter === "cancelled" ? styles.filterActive : styles.filterBtn
          }
          onClick={() => applyFilter("cancelled")}
        >
          Cancelled
        </button>
      </div>

      {/* NO DATA */}
      {filtered.length === 0 && (
        <p className={styles.info}>No trips found in this category.</p>
      )}

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((trip) => (
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

            <button
              className={styles.trackBtn}
              onClick={() => openDrawer(trip._id)}
            >
              View Details
            </button>
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

export default CustomerTripHistory;
