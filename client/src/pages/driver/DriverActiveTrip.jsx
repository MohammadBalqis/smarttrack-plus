import React, { useEffect, useState } from "react";
import { getActiveDriverTripApi } from "../../api/driverApi";
import { Link } from "react-router-dom";
import styles from "../../styles/driver/driverActiveTrip.module.css";

const DriverActiveTrip = () => {
  const [trip, setTrip] = useState(null);

  useEffect(() => {
    loadTrip();
  }, []);

  async function loadTrip() {
    try {
      const res = await getActiveDriverTripApi();
      setTrip(res.data.trip);
    } catch (err) {
      console.error("Failed:", err);
    }
  }

  if (!trip)
    return (
      <div className={styles.empty}>
        <h2>No active trip assigned</h2>
      </div>
    );

  return (
    <div className={styles.container}>
      <h1>Active Delivery</h1>

      <div className={styles.card}>
        <p><strong>Trip ID:</strong> {trip._id}</p>
        <p><strong>Customer:</strong> {trip.customer?.name}</p>
        <p><strong>Address:</strong> {trip.customerAddress}</p>
        <p><strong>Status:</strong> {trip.status}</p>
      </div>

      <Link to={`/driver/trips/${trip._id}`} className={styles.actionBtn}>
        View Trip Details →
      </Link>
    </div>
  );
};

export default DriverActiveTrip;
