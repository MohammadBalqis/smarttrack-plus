// client/src/pages/manager/ManagerDrivers.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyDriversApi,
  createCompanyDriverApi,
  updateCompanyDriverApi,
  toggleCompanyDriverStatusApi,
} from "../../api/companyDriversApi";

import ManagerDriverDrawer from "../../components/manager/ManagerDriverDrawer";
import styles from "../../styles/manager/managerDrivers.module.css";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
};

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");

  // Form
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await getCompanyDriversApi(params);
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      setError("");

      if (!editingId) {
        const res = await createCompanyDriverApi(form);
        setDrivers((prev) => [res.data.driver, ...prev]);
      } else {
        const res = await updateCompanyDriverApi(editingId, form);
        const updated = res.data.driver;

        setDrivers((prev) =>
          prev.map((d) => (d._id === updated._id ? updated : d))
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || "Failed to save driver. Check data.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleCompanyDriverStatusApi(id);
      const updated = res.data.driver;
      setDrivers((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to change driver status.");
    }
  };

  const openDrawer = (driver) => {
    setSelectedDriver(driver);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedDriver(null);
    setDrawerOpen(false);
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setForm({
      name: driver.name,
      email: driver.email,
      password: "",
      phoneNumber: driver.phoneNumber || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Drivers</h1>
          <p>Manage and monitor company drivers.</p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>
        </div>
      </div>

      {/* FORM */}
      <div className={styles.formCard}>
        <h3>{editingId ? "Edit Driver" : "Add New Driver"}</h3>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
          />

          <label>Email *</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleFormChange}
            required
          />

          {!editingId && (
            <>
              <label>Password *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleFormChange}
                required
              />
            </>
          )}

          <label>Phone Number</label>
          <input
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={handleFormChange}
          />

          <div className={styles.actions}>
            {editingId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Create Driver"}
            </button>
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        <h3>Drivers List</h3>

        {loading ? (
          <p>Loading...</p>
        ) : drivers.length === 0 ? (
          <p className={styles.empty}>No drivers found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {drivers.map((d) => (
                  <tr key={d._id}>
                    <td>{d.name}</td>
                    <td>{d.email}</td>
                    <td>{d.phoneNumber || "—"}</td>

                    <td>
                      <span
                        className={
                          d.isActive ? styles.activeBadge : styles.inactiveBadge
                        }
                      >
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleDateString()
                        : ""}
                    </td>

                    <td>
                      <button
                        className={styles.smallBtn}
                        onClick={() => openDrawer(d)}
                      >
                        View
                      </button>

                      <button
                        className={styles.smallBtn}
                        onClick={() => handleEdit(d)}
                      >
                        Edit
                      </button>

                      <button
                        className={styles.smallBtn}
                        onClick={() => handleToggleStatus(d._id)}
                      >
                        {d.isActive ? "Suspend" : "Activate"}
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
      <ManagerDriverDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        driver={selectedDriver}
      />
    </div>
  );
};

export default ManagerDrivers;
