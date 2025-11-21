import React, { useEffect, useState } from "react";
import { getCompanyTripsApi } from "../../api/companyTripsApi";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import ManagerTripDrawer from "../../components/manager/ManagerTripDrawer";
import styles from "../../styles/manager/managerTrips.module.css";

const ManagerTrips = () => {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    from: "",
    to: "",
  });

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadDrivers = async () => {
    try {
      const res = await getCompanyDriversApi({ status: "active" });
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error("Error loading drivers:", err);
    }
  };

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyTripsApi({
        page,
        status: filters.status || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      });
      setTrips(res.data.trips || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Error loading trips:", err);
      setError("Failed to load trips.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (trip) => {
    setSelectedTrip(trip);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setSelectedTrip(null);
    setDrawerOpen(false);
  };

  // Update a trip in state after assigning driver
  const handleTripUpdated = (updatedTrip) => {
    setTrips((prev) =>
      prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t))
    );
    setSelectedTrip(updatedTrip);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Manager — Trips</h1>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
        />
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Trips</h3>
          {loading && (
            <span className={styles.smallInfo}>Loading trips...</span>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {trips.length === 0 && !loading ? (
          <p className={styles.empty}>No trips found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Driver</th>
                  <th>Pickup</th>
                  <th>Dropoff</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td>{t.driverId?.name || "Unassigned"}</td>
                    <td>{t.pickupLocation?.address}</td>
                    <td>{t.dropoffLocation?.address}</td>
                    <td>
                      <span
                        className={
                          styles[`badge_${t.status}`] || styles.badge_default
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>${t.totalAmount?.toFixed(2) || "0.00"}</td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => handleOpenDrawer(t)}
                      >
                        View / Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>

      {/* Drawer */}
      <ManagerTripDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        trip={selectedTrip}
        drivers={drivers}
        onTripUpdated={handleTripUpdated}
      />
    </div>
  );
};

export default ManagerTrips;
