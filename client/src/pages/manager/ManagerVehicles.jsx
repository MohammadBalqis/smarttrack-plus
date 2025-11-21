// src/pages/manager/ManagerVehicles.jsx
import React, { useEffect, useState } from "react";
import { getCompanyVehiclesApi } from "../../api/companyVehiclesApi";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import ManagerVehicleDrawer from "../../components/manager/ManagerVehicleDrawer";
import styles from "../../styles/manager/managerVehicles.module.css";

const ManagerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [plateSearch, setPlateSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Load vehicles with filters
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (driverFilter) params.driverId = driverFilter;
      if (plateSearch) params.plate = plateSearch;

      const res = await getCompanyVehiclesApi(params);
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError("Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  // Load drivers for filter dropdown
  const loadDrivers = async () => {
    try {
      setDriversLoading(true);
      const res = await getCompanyDriversApi();
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error("Error loading drivers:", err);
    } finally {
      setDriversLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter, driverFilter, plateSearch]);

  useEffect(() => {
    loadDrivers();
  }, []);

  const openDrawer = (vehicle) => {
    setSelectedVehicle(vehicle);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedVehicle(null);
    setDrawerOpen(false);
  };

  const getDriverLabel = (vehicle) => {
    if (!vehicle.driverId) return "Unassigned";
    if (typeof vehicle.driverId === "object") {
      return vehicle.driverId.name || "Unnamed driver";
    }
    return "Driver";
  };

  const getLastTripDate = (vehicle) => {
    const lastTrip = vehicle.lastTripId;
    if (!lastTrip || !lastTrip.createdAt) return "—";
    return new Date(lastTrip.createdAt).toLocaleDateString();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Vehicles</h1>
          <p>Overview of your company’s fleet (view-only for managers).</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="car">Car</option>
          <option value="motor">Motor</option>
          <option value="truck">Truck</option>
          <option value="van">Van</option>
          <option value="pickup">Pickup</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
        </select>

        {/* Driver filter */}
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
        >
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Plate search */}
        <input
          type="text"
          placeholder="Search by plate..."
          value={plateSearch}
          onChange={(e) => setPlateSearch(e.target.value)}
        />
      </div>

      {/* Vehicles table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Vehicles List</h3>
          <div className={styles.headerInfo}>
            {driversLoading && (
              <span className={styles.smallInfo}>Loading drivers...</span>
            )}
            {loading && (
              <span className={styles.smallInfo}>Loading vehicles...</span>
            )}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {vehicles.length === 0 && !loading ? (
          <p className={styles.empty}>No vehicles found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Type</th>
                  <th>Brand / Model</th>
                  <th>Plate</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Last Trip</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td>
                      {v.vehicleImage ? (
                        <img
                          src={v.vehicleImage}
                          alt={v.plateNumber}
                          className={styles.thumbnail}
                        />
                      ) : (
                        <div className={styles.noImage}>No Image</div>
                      )}
                    </td>
                    <td className={styles.typeCell}>{v.type}</td>
                    <td>
                      {v.brand} {v.model}
                    </td>
                    <td>{v.plateNumber}</td>
                    <td>{getDriverLabel(v)}</td>
                    <td>
                      <span
                        className={
                          v.status === "available"
                            ? styles.badgeAvailable
                            : v.status === "in_use"
                            ? styles.badgeInUse
                            : styles.badgeMaintenance
                        }
                      >
                        {v.status === "in_use" ? "In Use" : v.status}
                      </span>
                    </td>
                    <td>{getLastTripDate(v)}</td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(v)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ManagerVehicleDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default ManagerVehicles;
