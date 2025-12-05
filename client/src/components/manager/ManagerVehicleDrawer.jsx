import React, { useEffect, useState } from "react";
import {
  assignDriverApi,
  removeDriverApi,
  updateVehicleStatusApi,
  getVehicleTripsApi,
} from "../../api/managerVehiclesApi";

import { getShopDriversApi } from "../../api/managerDriversApi";

import styles from "../../styles/manager/managerVehicleDrawer.module.css";

const ManagerVehicleDrawer = ({ open, onClose, vehicle, reload }) => {
  const [drivers, setDrivers] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);

  useEffect(() => {
    if (vehicle) {
      setStatus(vehicle.status);
      loadDrivers();
      loadTripHistory();
    }
  }, [vehicle]);

  const loadDrivers = async () => {
    try {
      const res = await getShopDriversApi(); // Only drivers from this shop
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadTripHistory = async () => {
    try {
      const res = await getVehicleTripsApi(vehicle._id);
      setTripHistory(res.data.trips || []);
    } catch (err) {
      console.error("Error loading trips:", err);
    }
  };

  if (!open || !vehicle) return null;

  const handleAssignDriver = async (driverId) => {
    setLoading(true);
    try {
      await assignDriverApi(vehicle._id, driverId);
      reload();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to assign driver");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDriver = async () => {
    setLoading(true);
    try {
      await removeDriverApi(vehicle._id);
      reload();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to remove driver");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    setLoading(true);
    try {
      await updateVehicleStatusApi(vehicle._id, status);
      reload();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.drawer}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h2>Vehicle Details</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.vehicleInfo}>
          <h3>{vehicle.brand} {vehicle.model}</h3>
          <p>Plate: {vehicle.plateNumber}</p>
        </div>

        <div className={styles.section}>
          <label>Assign Driver</label>
          <select
            onChange={(e) => handleAssignDriver(e.target.value)}
            defaultValue=""
          >
            <option value="">Select driver</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {vehicle.driverId && (
            <button
              className={styles.removeBtn}
              onClick={handleRemoveDriver}
              disabled={loading}
            >
              Remove Driver
            </button>
          )}
        </div>

        <div className={styles.section}>
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <button onClick={handleStatusChange} disabled={loading}>
            Update Status
          </button>
        </div>

        <div className={styles.section}>
          <h3>Trip History</h3>
          <ul className={styles.tripList}>
            {tripHistory.map((t) => (
              <li key={t._id}>
                <strong>{t.customerId?.name}</strong> — {t.status}  
                <br />
                <small>{new Date(t.createdAt).toLocaleString()}</small>
              </li>
            ))}
            {tripHistory.length === 0 && <p>No trips.</p>}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default ManagerVehicleDrawer;
