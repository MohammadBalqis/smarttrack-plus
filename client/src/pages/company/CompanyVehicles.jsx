// client/src/pages/company/CompanyVehicles.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyVehiclesApi,
  updateCompanyVehicleStatusApi,
  getCompanyVehicleTripsApi,
} from "../../api/companyVehiclesApi";

import styles from "../../styles/company/companyVehicles.module.css";

const CompanyVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [plateSearch, setPlateSearch] = useState("");

  // Drawer
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  /* ==========================================================
     LOAD VEHICLES (READ ONLY)
  ========================================================== */
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (plateSearch) params.plate = plateSearch;

      const res = await getCompanyVehiclesApi(params);
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, plateSearch]);

  /* ==========================================================
     STATUS UPDATE (available / maintenance)
  ========================================================== */
  const handleStatusChange = async (vehicleId, status) => {
    try {
      const res = await updateCompanyVehicleStatusApi(vehicleId, status);
      const updated = res.data.vehicle;

      setVehicles((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update status");
    }
  };

  /* ==========================================================
     DRAWER
  ========================================================== */
  const openDrawer = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setDrawerOpen(true);
    setTripHistory([]);

    try {
      setLoadingTrips(true);
      const res = await getCompanyVehicleTripsApi(vehicle._id);
      setTripHistory(res.data.trips || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const closeDrawer = () => {
    setSelectedVehicle(null);
    setTripHistory([]);
    setDrawerOpen(false);
  };

  const getCertificateStatus = (driver) => {
    if (!driver?.driverVerificationStatus) return "Pending";
    return driver.driverVerificationStatus;
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1>Vehicles</h1>
          <p>Verified vehicles registered by drivers</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersRow}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <input
          type="text"
          placeholder="Search by plate..."
          value={plateSearch}
          onChange={(e) => setPlateSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p>Loading vehicles…</p>
        ) : vehicles.length === 0 ? (
          <p className={styles.empty}>No vehicles found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Plate</th>
                  <th>Driver</th>
                  <th>Certificate</th>
                  <th>Branch</th>
                  <th>Status</th>
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

                    <td>{v.plateNumber}</td>

                    <td>{v.driverId?.name || "—"}</td>

                    <td>
                      <span
                        className={
                          v.driverId?.driverVerificationStatus === "verified"
                            ? styles.badgeVerified
                            : styles.badgePending
                        }
                      >
                        {getCertificateStatus(v.driverId)}
                      </span>
                    </td>

                    <td>
                      {v.driverId?.shopId
                        ? `${v.driverId.shopId.name} (${v.driverId.shopId.city})`
                        : "—"}
                    </td>

                    <td>
                      <select
                        value={v.status}
                        onChange={(e) =>
                          handleStatusChange(v._id, e.target.value)
                        }
                        className={styles.statusSelect}
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(v)}
                      >
                        Trips
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER */}
      {drawerOpen && selectedVehicle && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <button className={styles.drawerClose} onClick={closeDrawer}>
              ✕
            </button>

            <h2>
              {selectedVehicle.plateNumber} — Trip History
            </h2>

            {loadingTrips ? (
              <p>Loading…</p>
            ) : tripHistory.length === 0 ? (
              <p className={styles.empty}>No trips yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Customer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tripHistory.map((t) => (
                    <tr key={t._id}>
                      <td>
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td>{t.driverId?.name || "—"}</td>
                      <td>{t.customerId?.name || "—"}</td>
                      <td>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyVehicles;
