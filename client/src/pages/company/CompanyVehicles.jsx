// client/src/pages/company/CompanyVehicles.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyVehiclesApi,
  createCompanyVehicleApi,
  updateCompanyVehicleApi,
  assignCompanyVehicleDriverApi,
  updateCompanyVehicleStatusApi,
  getCompanyVehicleTripsApi,
} from "../../api/companyVehiclesApi";
import { getCompanyDriversApi } from "../../api/companyDriversApi";

import styles from "../../styles/company/companyVehicles.module.css";

const emptyForm = {
  type: "car",
  brand: "",
  model: "",
  plateNumber: "",
  notes: "",
  vehicleImage: "",
};

const CompanyVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [plateSearch, setPlateSearch] = useState("");

  // Loading/error
  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [error, setError] = useState("");

  // Form (create/edit)
  const [form, setForm] = useState(emptyForm);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Drawer / details
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVehicleId(null);
    setError("");
  };

  const handleEdit = (vehicle) => {
    setEditingVehicleId(vehicle._id);
    setForm({
      type: vehicle.type || "car",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      plateNumber: vehicle.plateNumber || "",
      notes: vehicle.notes || "",
      vehicleImage: vehicle.vehicleImage || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");

      const payload = {
        ...form,
      };
      if (!payload.vehicleImage) delete payload.vehicleImage;

      if (!editingVehicleId) {
        // Create
        const res = await createCompanyVehicleApi(payload);
        setVehicles((prev) => [res.data.vehicle, ...prev]);
      } else {
        // Update
        const res = await updateCompanyVehicleApi(editingVehicleId, payload);
        const updated = res.data.vehicle;
        setVehicles((prev) =>
          prev.map((v) => (v._id === updated._id ? updated : v))
        );
      }

      resetForm();
    } catch (err) {
      console.error("Error saving vehicle:", err);
      const msg =
        err.response?.data?.error ||
        "Failed to save vehicle. Please check your data.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDriver = async (vehicleId, driverId) => {
    try {
      const res = await assignCompanyVehicleDriverApi(vehicleId, driverId);
      const updated = res.data.vehicle;
      setVehicles((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
    } catch (err) {
      console.error("Error assigning driver:", err);
      setError("Failed to assign driver.");
    }
  };

  const handleStatusChange = async (vehicleId, status) => {
    try {
      const res = await updateCompanyVehicleStatusApi(vehicleId, status);
      const updated = res.data.vehicle;
      setVehicles((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update vehicle status.");
    }
  };

  const openDrawer = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setTripHistory([]);
    setDrawerOpen(true);
    try {
      setLoadingTrips(true);
      const res = await getCompanyVehicleTripsApi(vehicle._id);
      setTripHistory(res.data.trips || []);
    } catch (err) {
      console.error("Error loading trips:", err);
    } finally {
      setLoadingTrips(false);
    }
  };

  const closeDrawer = () => {
    setSelectedVehicle(null);
    setTripHistory([]);
    setDrawerOpen(false);
  };

  const getDriverLabel = (vehicle) => {
    if (!vehicle.driverId) return "Unassigned";
    if (typeof vehicle.driverId === "object") {
      return vehicle.driverId.name || "Unnamed driver";
    }
    return "Driver";
  };

  const getStatusBadgeClass = (status) => {
    if (status === "available") return styles.badgeAvailable;
    if (status === "in_use") return styles.badgeInUse;
    return styles.badgeMaintenance;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1>Vehicles</h1>
          <p>Manage your company’s fleet: add, edit, assign and track usage.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className={styles.formCard}>
        <div className={styles.formHeaderRow}>
          <h3>{editingVehicleId ? "Edit Vehicle" : "Add New Vehicle"}</h3>
          {saving && <span className={styles.smallInfo}>Saving...</span>}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <label>
              Type *
              <select
                name="type"
                value={form.type}
                onChange={handleFormChange}
              >
                <option value="car">Car</option>
                <option value="motor">Motor</option>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
                <option value="pickup">Pickup</option>
              </select>
            </label>

            <label>
              Brand *
              <input
                name="brand"
                value={form.brand}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Model *
              <input
                name="model"
                value={form.model}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Plate Number *
              <input
                name="plateNumber"
                value={form.plateNumber}
                onChange={handleFormChange}
                required
              />
            </label>

            <label>
              Image URL
              <input
                name="vehicleImage"
                value={form.vehicleImage}
                onChange={handleFormChange}
                placeholder="https://example.com/vehicle.jpg"
              />
            </label>
          </div>

          <label className={styles.notesLabel}>
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows={3}
            />
          </label>

          <div className={styles.formActions}>
            {editingVehicleId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {editingVehicleId ? "Save Changes" : "Create Vehicle"}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
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
                  <th>Assign</th>
                  <th>Actions</th>
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
                      <select
                        value={v.status}
                        onChange={(e) =>
                          handleStatusChange(v._id, e.target.value)
                        }
                        className={getStatusBadgeClass(v.status)}
                      >
                        <option value="available">Available</option>
                        <option value="in_use">In Use</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={v.driverId?._id || v.driverId || ""}
                        onChange={(e) =>
                          handleAssignDriver(
                            v._id,
                            e.target.value || null // empty => remove
                          )
                        }
                      >
                        <option value="">Unassigned</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => openDrawer(v)}
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => handleEdit(v)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer – simple version */}
      {drawerOpen && selectedVehicle && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <button className={styles.drawerClose} onClick={closeDrawer}>
              ✕
            </button>

            <h2>Vehicle Details</h2>
            <p>
              <strong>
                {selectedVehicle.brand} {selectedVehicle.model}
              </strong>{" "}
              — {selectedVehicle.plateNumber}
            </p>
            <p>Type: {selectedVehicle.type}</p>
            <p>Notes: {selectedVehicle.notes || "—"}</p>

            <h3 className={styles.drawerSubTitle}>Recent Trips</h3>
            {loadingTrips ? (
              <p>Loading...</p>
            ) : tripHistory.length === 0 ? (
              <p className={styles.empty}>No trips for this vehicle yet.</p>
            ) : (
              <div className={styles.drawerTableWrapper}>
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
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleString()
                            : "—"}
                        </td>
                        <td>{t.driverId?.name || "—"}</td>
                        <td>{t.customerId?.name || "—"}</td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyVehicles;
