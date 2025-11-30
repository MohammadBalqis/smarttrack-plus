// client/src/pages/manager/ManagerVehicles.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyVehiclesApi,
  createCompanyVehicleApi,
  updateCompanyVehicleApi,
  updateCompanyVehicleStatusApi,
} from "../../api/companyVehiclesApi";

import ManagerVehicleDrawer from "../../components/manager/ManagerVehicleDrawer";

import styles from "../../styles/manager/managerVehicles.module.css";

const emptyForm = {
  plateNumber: "",
  brand: "",
  model: "",
  type: "car",
  capacityKg: "",
};

const ManagerVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter
  const [statusFilter, setStatusFilter] = useState("");

  // Form
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Load vehicles
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter) params.status = statusFilter;

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
  }, [statusFilter]);

  /* ---------------- Form Logic ---------------- */

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        ...form,
        capacityKg: form.capacityKg ? Number(form.capacityKg) : undefined,
      };

      if (!editingId) {
        const res = await createCompanyVehicleApi(payload);
        setVehicles((prev) => [res.data.vehicle, ...prev]);
      } else {
        const res = await updateCompanyVehicleApi(editingId, payload);
        const updated = res.data.vehicle;

        setVehicles((prev) =>
          prev.map((v) => (v._id === updated._id ? updated : v))
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";

      const res = await updateCompanyVehicleStatusApi(id, newStatus);
      const updated = res.data.vehicle;

      setVehicles((prev) =>
        prev.map((v) => (v._id === updated._id ? updated : v))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update status.");
    }
  };

  const handleEdit = (vehicle) => {
    setEditingId(vehicle._id);
    setForm({
      plateNumber: vehicle.plateNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      type: vehicle.type || "car",
      capacityKg: vehicle.capacityKg || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Vehicles</h1>
        <p>Manage company vehicles used in deliveries.</p>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {/* FORM */}
      <div className={styles.formCard}>
        <h3>{editingId ? "Edit Vehicle" : "Add Vehicle"}</h3>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Plate Number *</label>
          <input
            name="plateNumber"
            value={form.plateNumber}
            onChange={handleFormChange}
            required
          />

          <label>Brand *</label>
          <input
            name="brand"
            value={form.brand}
            onChange={handleFormChange}
            required
          />

          <label>Model *</label>
          <input
            name="model"
            value={form.model}
            onChange={handleFormChange}
            required
          />

          <label>Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleFormChange}
          >
            <option value="car">Car</option>
            <option value="bike">Bike</option>
            <option value="van">Van</option>
            <option value="truck">Truck</option>
            <option value="mototr">Motor</option>
          </select>

          <label>Capacity (kg)</label>
          <input
            type="number"
            name="capacityKg"
            value={form.capacityKg}
            onChange={handleFormChange}
          />

          <div className={styles.actions}>
            {editingId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Vehicle"}
            </button>
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        <h3>Vehicles List</h3>

        {loading ? (
          <p>Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className={styles.empty}>No vehicles found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Brand / Model</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td>{v.plateNumber}</td>
                    <td>{v.brand} {v.model}</td>
                    <td>{v.type || "—"}</td>
                    <td>
                      <span
                        className={
                          v.isActive ? styles.activeBadge : styles.inactiveBadge
                        }
                      >
                        {v.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "—"}</td>
                    <td>
                      <button
                        className={styles.smallBtn}
                        onClick={() => {
                          setSelectedVehicle(v);
                          setDrawerOpen(true);
                        }}
                      >
                        View
                      </button>

                      <button
                        className={styles.smallBtn}
                        onClick={() => handleEdit(v)}
                      >
                        Edit
                      </button>

                      <button
                        className={styles.smallBtn}
                        onClick={() => handleToggleStatus(v._id, v.isActive ? "active" : "inactive")}
                      >
                        {v.isActive ? "Suspend" : "Activate"}
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
      <ManagerVehicleDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        vehicle={selectedVehicle}
      />
    </div>
  );
};

export default ManagerVehicles;
