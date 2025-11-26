// client/src/pages/manager/ManagerDrivers.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerDriversApi,
  toggleManagerDriverStatusApi,
  updateManagerDriverApi, // uses company/manager driver update route
  getManagerDriverStatsApi,
  getManagerDriverRecentTripsApi,
} from "../../api/managerDriversApi";

import styles from "../../styles/manager/managerDrivers.module.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
};

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [editingDriver, setEditingDriver] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  const [statsDriver, setStatsDriver] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter) params.status = statusFilter;

      const res = await getManagerDriversApi(params);
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const openEditModal = (driver) => {
    setEditingDriver(driver);
    setEditForm({
      name: driver.name || "",
      email: driver.email || "",
      phone: driver.phone || "",
    });
  };

  const closeEditModal = () => {
    setEditingDriver(null);
    setEditForm(emptyForm);
    setError("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingDriver) return;

    try {
      setSavingEdit(true);
      setError("");

      const res = await updateManagerDriverApi(editingDriver._id, editForm);
      const updated = res.data.driver;

      setDrivers((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );

      closeEditModal();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error || "Failed to update driver. Try again.";
      setError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async (driver) => {
    try {
      const newStatus = !driver.isActive;
      const res = await toggleManagerDriverStatusApi(driver._id, newStatus);
      const updated = res.data.driver;

      setDrivers((prev) =>
        prev.map((d) => (d._id === updated._id ? updated : d))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to change driver status.");
    }
  };

  const openStatsModal = async (driver) => {
    setStatsDriver(driver);
    setStats(null);
    setRecentTrips([]);
    setLoadingStats(true);

    try {
      const [statsRes, tripsRes] = await Promise.all([
        getManagerDriverStatsApi(driver._id),
        getManagerDriverRecentTripsApi(driver._id),
      ]);

      setStats(statsRes.data.stats || null);
      setRecentTrips(tripsRes.data.trips || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load driver statistics.");
    } finally {
      setLoadingStats(false);
    }
  };

  const closeStatsModal = () => {
    setStatsDriver(null);
    setStats(null);
    setRecentTrips([]);
    setError("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Drivers</h1>
          <p className={styles.subtitle}>
            View and manage your company&apos;s drivers.
          </p>
        </div>

        <div className={styles.filters}>
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

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p>Loading drivers...</p>
      ) : drivers.length === 0 ? (
        <p className={styles.empty}>No drivers found.</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Vehicle</th>
                <th>Online</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d._id}>
                  <td className={styles.driverCell}>
                    <div className={styles.driverInfo}>
                      {d.profileImage ? (
                        <img
                          src={d.profileImage}
                          alt={d.name}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {d.name?.[0] || "D"}
                        </div>
                      )}
                      <span>{d.name}</span>
                    </div>
                  </td>
                  <td>{d.email}</td>
                  <td>{d.phone || "—"}</td>
                  <td>
                    <span
                      className={
                        d.isActive
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {d.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {d.assignedVehicle
                      ? `${d.assignedVehicle.plateNumber || ""} ${
                          d.assignedVehicle.brand || ""
                        }`
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={
                        d.onlineStatus === "online"
                          ? styles.badgeOnline
                          : styles.badgeOffline
                      }
                    >
                      {d.onlineStatus || "offline"}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => openStatsModal(d)}
                    >
                      Stats
                    </button>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => openEditModal(d)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => handleToggleStatus(d)}
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

      {/* Edit Modal */}
      {editingDriver && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Edit Driver</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeEditModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitEdit} className={styles.modalForm}>
              <label>
                Name
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  placeholder="+961..."
                />
              </label>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className={styles.secondaryBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsDriver && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Driver Stats — {statsDriver.name}</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={closeStatsModal}
              >
                ✕
              </button>
            </div>

            {loadingStats ? (
              <p>Loading stats...</p>
            ) : (
              <>
                {stats && (
                  <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>
                        Delivered Trips
                      </span>
                      <span className={styles.statNumber}>
                        {stats.delivered}
                      </span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>Active Trips</span>
                      <span className={styles.statNumber}>
                        {stats.activeTrips}
                      </span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>
                        Total Distance (km)
                      </span>
                      <span className={styles.statNumber}>
                        {stats.totalDistance || 0}
                      </span>
                    </div>
                  </div>
                )}

                <h3 className={styles.subTitle}>Recent Trips</h3>

                {recentTrips.length === 0 ? (
                  <p className={styles.empty}>No recent trips.</p>
                ) : (
                  <div className={styles.recentTripsWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Customer</th>
                          <th>Vehicle</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTrips.map((t) => (
                          <tr key={t._id}>
                            <td>{t.status}</td>
                            <td>{t.customerId?.name || "—"}</td>
                            <td>
                              {t.vehicleId
                                ? `${t.vehicleId.plateNumber || ""} ${
                                    t.vehicleId.brand || ""
                                  }`
                                : "—"}
                            </td>
                            <td>
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleString()
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDrivers;
