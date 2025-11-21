import React, { useEffect, useState } from "react";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import ManagerDriverDrawer from "../../components/manager/ManagerDriverDrawer";
import styles from "../../styles/manager/managerDrivers.module.css";

const ManagerDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    loadDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

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

  const filteredDrivers = drivers.filter((d) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      d.name?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term)
    );
  });

  const handleOpenDrawer = (driver) => {
    setSelectedDriver(driver);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setSelectedDriver(null);
    setDrawerOpen(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Drivers</h1>
          <p>Overview of all company drivers and their recent performance.</p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Drivers Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Drivers List</h3>
          {loading && (
            <span className={styles.smallInfo}>Loading drivers...</span>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {filteredDrivers.length === 0 && !loading ? (
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
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((d) => (
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
                        : "—"}
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleOpenDrawer(d)}
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
      <ManagerDriverDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        driver={selectedDriver}
      />
    </div>
  );
};

export default ManagerDrivers;
