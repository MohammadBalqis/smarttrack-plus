import React, { useEffect, useState } from "react";
import {
  getCompanyDriversApi,
  createCompanyDriverApi,
  updateCompanyDriverApi,
  toggleCompanyDriverStatusApi,
} from "../../api/companyDriversApi";
import styles from "../../styles/company/companyDrivers.module.css";

const emptyForm = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
};

const CompanyDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState(""); // "active" | "inactive" | ""
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyDriversApi(
        statusFilter ? { status: statusFilter } : {}
      );
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

  const handleChange = (e) => {
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
    setSaving(true);
    setError("");

    try{
      if (!editingId) {
        // create
        if (!form.password) {
          setError("Password is required for new drivers.");
          setSaving(false);
          return;
        }
        const payload = {
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
          password: form.password,
        };
        const res = await createCompanyDriverApi(payload);
        setDrivers((prev) => [res.data.driver, ...prev]);
      } else {
        // update
        const payload = {
          name: form.name,
          email: form.email,
          phoneNumber: form.phoneNumber,
        };
        const res = await updateCompanyDriverApi(editingId, payload);
        setDrivers((prev) =>
          prev.map((d) => (d._id === editingId ? res.data.driver : d))
        );
      }

      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Failed to save driver. Please check the data.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setForm({
      name: driver.name || "",
      email: driver.email || "",
      phoneNumber: driver.phoneNumber || "",
      password: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setError("Failed to update driver status.");
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>Drivers</h2>
          <p>Manage your company&apos;s drivers and their access.</p>
        </div>
      </div>

      {/* Form Card */}
      <div className={styles.formCard}>
        <div className={styles.formHeaderRow}>
          <h3>{editingId ? "Edit Driver" : "Create New Driver"}</h3>
          {saving && <span className={styles.smallInfo}>Saving...</span>}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <label>Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            <label>Phone</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="+961..."
            />
          </div>

          {!editingId && (
            <div className={styles.formRow}>
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className={styles.formActions}>
            {editingId && (
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={saving}
            >
              {editingId ? "Save Changes" : "Create Driver"}
            </button>
          </div>
        </form>
      </div>

      {/* Drivers Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Drivers List</h3>
          <div className={styles.filters}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {loading && (
              <span className={styles.smallInfo}>Loading drivers...</span>
            )}
          </div>
        </div>

        {drivers.length === 0 ? (
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
                  <th>Actions</th>
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
                          d.isActive
                            ? styles.statusBadgeActive
                            : styles.statusBadgeInactive
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
                    <td className={styles.actionsCell}>
                      <button
                        type="button"
                        className={styles.tableBtn}
                        onClick={() => handleEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.tableBtn}
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
    </div>
  );
};

export default CompanyDrivers;
