import React, { useEffect, useState } from "react";
import { getDriverProfileApi, getDriverVehicleApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverSettings.module.css";

const DriverSettings = () => {
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const resProfile = await getDriverProfileApi();
      const resVehicle = await getDriverVehicleApi();

      setProfile(resProfile.data?.driver || null);
      setVehicle(resVehicle.data?.vehicle || null);
    } catch (err) {
      console.error("Failed to load driver settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className={styles.page}>Loading...</div>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Account details and configuration (read-only)</p>

      {/* ================================
          ACCOUNT INFO
      ================================= */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Account Information</h2>

        <div className={styles.row}>
          <span className={styles.label}>Full Name:</span>
          <span className={styles.value}>{profile?.name || "—"}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Email:</span>
          <span className={styles.value}>{profile?.email || "—"}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Phone:</span>
          <span className={styles.value}>{profile?.phone || "—"}</span>
        </div>
      </div>

      {/* ================================
          COMPANY INFO
      ================================= */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Company</h2>

        <div className={styles.row}>
          <span className={styles.label}>Company Name:</span>
          <span className={styles.value}>{profile?.companyName || "—"}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Role:</span>
          <span className={styles.value}>Driver</span>
        </div>
      </div>

      {/* ================================
          VEHICLE
      ================================= */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Assigned Vehicle</h2>

        {vehicle ? (
          <>
            <div className={styles.row}>
              <span className={styles.label}>Brand:</span>
              <span className={styles.value}>{vehicle.brand}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Model:</span>
              <span className={styles.value}>{vehicle.model}</span>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Plate Number:</span>
              <span className={styles.value}>{vehicle.plateNumber}</span>
            </div>
          </>
        ) : (
          <p className={styles.muted}>No vehicle assigned.</p>
        )}
      </div>

      {/* ================================
          APP SETTINGS (READ-ONLY)
      ================================= */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>App Settings</h2>

        <div className={styles.row}>
          <span className={styles.label}>Map Theme:</span>
          <span className={styles.value}>Auto (Day/Night)</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Language:</span>
          <span className={styles.value}>English</span>
        </div>

        <p className={styles.muted}>
          Settings cannot be edited. Contact your manager for changes.
        </p>
      </div>
    </div>
  );
};

export default DriverSettings;
