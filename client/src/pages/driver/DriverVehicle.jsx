// client/src/pages/driver/DriverVehicle.jsx
import React, { useEffect, useState } from "react";
import { getDriverVehicleApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverVehicle.module.css";

const DriverVehicle = () => {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      const res = await getDriverVehicleApi();
      setVehicle(res.data?.vehicle || null);
    } catch (err) {
      console.error("Failed loading vehicle:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicle();
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Assigned Vehicle</h1>

      <div className={styles.card}>
        {loading ? (
          <p className={styles.muted}>Loading vehicle info...</p>
        ) : !vehicle ? (
          <p className={styles.muted}>No vehicle assigned.</p>
        ) : (
          <>
            <p>
              <strong>Model:</strong>{" "}
              {vehicle.model || `${vehicle.brand || ""} ${vehicle.type || ""}`}
            </p>
            <p>
              <strong>Plate:</strong> {vehicle.plate || vehicle.plateNumber || "—"}
            </p>
            <p>
              <strong>Status:</strong> {vehicle.status || "—"}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverVehicle;
