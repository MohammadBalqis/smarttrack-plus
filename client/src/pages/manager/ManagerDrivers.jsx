// client/src/pages/manager/ManagerDrivers.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerDriversApi,
  toggleManagerDriverStatusApi,
} from "../../api/managerDriversApi";

import ManagerDriverDrawer from "../../components/manager/ManagerDriverDrawer";
import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "active", "inactive"
  const [driverStatusFilter, setDriverStatusFilter] = useState(""); // available, busy, offline

  // Pagination (simple)
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit };

      if (search.trim()) params.search = search.trim();
      if (activeFilter) params.isActive = activeFilter;
      if (driverStatusFilter) params.driverStatus = driverStatusFilter;

      const res = await getManagerDriversApi(params);

      const data = res.data;
      setDrivers(data.drivers || data.data || []); // support both shapes
      setTotal(data.total || data.count || (data.drivers?.length || 0));
    } catch (err) {
      console.error("Error loading drivers:", err);
      setError(
        err.response?.data?.error || "Failed to load drivers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilter, driverStatusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadDrivers();
  };

  const openDrawer = (driver) => {
    setSelectedDriver(driver);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedDriver(null);
    setDrawerOpen(false);
  };

  const handleToggleStatus = async (driver) => {
    try {
      await toggleManagerDriverStatusApi(driver._id);
      loadDrivers();
    } catch (err) {
      console.error("Toggle driver status failed:", err);
      alert("Failed to update driver status.");
    }
  };

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  const getStatusBadgeClass = (d) => {
    if (d.driverStatus === "available") return styles.driverStatusAvailable;
    if (d.driverStatus === "busy") return styles.driverStatusBusy;
    if (d.driverStatus === "offline") return styles.driverStatusOffline;
    return styles.driverStatusUnknown;
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Drivers</h1>
          <p className={styles.subtitle}>
            Manage and monitor your delivery drivers across your company or shop.
          </p>
        </div>

        <div className={styles.headerStats}>
          <span>
            Total: <strong>{total}</strong>
          </span>
          <span>
            Page: <strong>{page}</strong> / {totalPages}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by name / email / phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className={styles.filtersRight}>
          <select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All drivers</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            value={driverStatusFilter}
            onChange={(e) => {
              setDriverStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="busy">Busy / On Trip</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Drivers List</h3>
          {loading && <span className={styles.smallInfo}>Loading…</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && drivers.length === 0 ? (
          <p className={styles.empty}>No drivers found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Trips Done</th>
                  <th>Score</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div className={styles.driverCell}>
                        {d.profileImage ? (
                          <img
                            src={d.profileImage}
                            alt={d.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {d.name?.charAt(0) || "D"}
                          </div>
                        )}
                        <div>
                          <div className={styles.driverName}>{d.name}</div>
                          <div className={styles.shopLabel}>
                            {d.shop?.name
                              ? `${d.shop.name}${d.shop.city ? ` (${d.shop.city})` : ""}`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.contactCell}>
                        <div>{d.email || "—"}</div>
                        <div className={styles.phoneText}>
                          {d.phoneNumber || d.phone || "—"}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className={styles.statusCell}>
                        <span
                          className={
                            d.isActive !== false
                              ? styles.activeBadge
                              : styles.inactiveBadge
                          }
                        >
                          {d.isActive !== false ? "Active" : "Inactive"}
                        </span>
                        <span className={getStatusBadgeClass(d)}>
                          {d.driverStatus
                            ? d.driverStatus.replace("_", " ")
                            : "Unknown"}
                        </span>
                      </div>
                    </td>

                    <td>{d.totalTripsCompleted ?? 0}</td>
                    <td>
                      {d.performanceScore != null
                        ? d.performanceScore.toFixed(1)
                        : "—"}
                    </td>

                    <td>{formatDate(d.createdAt)}</td>

                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.viewBtn}
                          onClick={() => openDrawer(d)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className={styles.toggleBtn}
                          onClick={() => handleToggleStatus(d)}
                        >
                          {d.isActive !== false ? "Suspend" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((p) => (p < totalPages ? p + 1 : p))
              }
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ManagerDriverDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        driver={selectedDriver}
        onUpdated={loadDrivers}
      />
    </div>
  );
};

export default ManagerDrivers;
