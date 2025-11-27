import React, { useEffect, useState } from "react";
import { getDriverVehicleApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverVehicle.module.css";

const DriverVehicle = () => {
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    loadVehicle();
  }, []);

  const loadVehicle = async () => {
    try {
      const res = await getDriverVehicleApi();
      setVehicle(res.data.vehicle);
    } catch (err) {
      console.error("Failed loading vehicle:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Assigned Vehicle</h1>

      <div className={styles.card}>
        {!vehicle ? (
          <p>No vehicle assigned.</p>
        ) : (
          <>
            <p><strong>Model:</strong> {vehicle.model}</p>
            <p><strong>Plate:</strong> {vehicle.plate}</p>
            <p><strong>Status:</strong> {vehicle.status}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DriverVehicle;
