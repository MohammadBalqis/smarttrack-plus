import React, { useEffect, useState } from "react";
import {
  getManagerVehiclesApi,
} from "../../api/managerVehiclesApi";
import ManagerVehicleDrawer from "../../components/manager/ManagerVehicleDrawer";

import styles from "../../styles/manager/managerVehicles.module.css";

const ManagerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const res = await getManagerVehiclesApi();
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openDrawer = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedVehicle(null);
    setDrawerOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return styles.statusAvailable;
      case "in_use":
        return styles.statusInUse;
      case "maintenance":
        return styles.statusMaintenance;
      default:
        return styles.statusUnknown;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vehicles</h1>
        <p>Manage vehicles assigned to your shop.</p>
      </div>

      {loading && <p className={styles.loading}>Loading...</p>}

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Plate</th>
              <th>Driver</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {vehicles.map((v) => (
              <tr key={v._id}>
                <td>
                  {v.brand} {v.model}
                </td>

                <td>{v.plateNumber}</td>

                <td>{v.driverId ? v.driverId.name : "—"}</td>

                <td>
                  <span className={`${styles.badge} ${getStatusBadge(v.status)}`}>
                    {v.status}
                  </span>
                </td>

                <td>{new Date(v.createdAt).toLocaleDateString()}</td>

                <td>
                  <button
                    className={styles.viewBtn}
                    onClick={() => openDrawer(v)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {vehicles.length === 0 && !loading && (
          <p className={styles.empty}>No vehicles found.</p>
        )}
      </div>

      {/* Drawer */}
      <ManagerVehicleDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        vehicle={selectedVehicle}
        reload={loadVehicles}
      />
    </div>
  );
};

export default ManagerVehicles;
