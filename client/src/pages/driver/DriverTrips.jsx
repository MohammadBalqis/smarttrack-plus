import React, { useEffect, useState } from "react";
import { getDriverTripsApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverTrips.module.css";

const DriverTrips = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const res = await getDriverTripsApi();
      setTrips(res.data.trips);
    } catch (err) {
      console.error("Failed to load driver trips:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Trips</h1>

      <div className={styles.card}>
        {trips.length === 0 ? (
          <p>No trips found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Fee</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t._id}>
                  <td>{t._id.slice(-6)}</td>
                  <td>{t.customer?.name}</td>
                  <td>{t.status}</td>
                  <td>${t.deliveryFee?.toFixed(2)}</td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DriverTrips;
