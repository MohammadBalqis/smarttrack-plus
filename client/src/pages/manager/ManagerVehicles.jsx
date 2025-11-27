// client/src/pages/manager/ManagerVehicles.jsx
import React, { useEffect, useState } from "react";
import { getCompanyVehiclesApi } from "../../api/companyVehiclesApi";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import {
  updateVehicleStatusApi,
  getVehicleTripsApi,
  assignVehicleDriverApi,
} from "../../api/managerVehiclesApi";

import { useBranding } from "../../context/BrandingContext";
import ManagerVehicleDrawer from "../../components/manager/ManagerVehicleDrawer";
import styles from "../../styles/manager/managerVehicles.module.css";

const ManagerVehicles = () => {
  const { branding } = useBranding();

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

  const [statusSavingId, setStatusSavingId] = useState(null);

  /* ==========================================================
     LOAD VEHICLES
  ========================================================== */
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
      const msg =
        err.response?.data?.error || "Failed to load vehicles. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOAD DRIVERS
  ========================================================== */
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
  }, [typeFilter, statusFilter, driverFilter, plateSearch]);

  useEffect(() => {
    loadDrivers();
  }, []);

  /* ==========================================================
     UI HELPERS
  ========================================================== */
  const openDrawer = (v) => {
    setSelectedVehicle(v);
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

    const d = new Date(lastTrip.createdAt);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  /* ==========================================================
     UPDATE VEHICLE STATUS
  ========================================================== */
  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      setStatusSavingId(vehicleId);
      setError("");

      await updateVehicleStatusApi(vehicleId, newStatus);

      // Update UI state
      setVehicles((prev) =>
        prev.map((v) =>
          v._id === vehicleId ? { ...v, status: newStatus } : v
        )
      );
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      const msg =
        err.response?.data?.error || "Failed to update vehicle status.";
      setError(msg);
    } finally {
      setStatusSavingId(null);
    }
  };

  const statusOptions = [
    { value: "available", label: "Available" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
  ];

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vehicles</h1>
          <p className={styles.subtitle}>
            Overview of your company’s fleet. Filter, view details, and update
            their status.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={loadVehicles}
          disabled={loading}
          style={{ background: branding.primaryColor }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className={styles.filtersRow}>
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
        </select>

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

        <input
          type="text"
          placeholder="Search by plate..."
          value={plateSearch}
          onChange={(e) => setPlateSearch(e.target.value)}
        />
      </div>

      {/* ================= VEHICLES TABLE ================= */}
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
            {statusSavingId && (
              <span className={styles.smallInfo}>Updating vehicle status...</span>
            )}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && vehicles.length === 0 ? (
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
                        <div
                          className={styles.noImage}
                          style={{ borderColor: branding.primaryColor }}
                        >
                          No Image
                        </div>
                      )}
                    </td>

                    <td className={styles.typeCell}>{v.type}</td>

                    <td>
                      {v.brand} {v.model}
                    </td>

                    <td>{v.plateNumber}</td>

                    <td>{getDriverLabel(v)}</td>

                    <td>
                      <select
                        className={styles.statusSelect}
                        value={v.status}
                        onChange={(e) =>
                          handleStatusChange(v._id, e.target.value)
                        }
                        disabled={!!statusSavingId}
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>{getLastTripDate(v)}</td>

                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(v)}
                        style={{ background: branding.primaryColor }}
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

      {/* ================= DRAWER ================= */}
      <ManagerVehicleDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default ManagerVehicles;
