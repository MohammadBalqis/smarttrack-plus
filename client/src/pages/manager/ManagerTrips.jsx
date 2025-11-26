// client/src/pages/manager/ManagerTrips.jsx
import React, { useEffect, useState } from "react";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import { getCompanyVehiclesApi } from "../../api/companyVehiclesApi";
import {
  getManagerTripsApi,
  getManagerTripStatsApi,
} from "../../api/managerTripsApi";
import ManagerTripDrawer from "../../components/manager/ManagerTripDrawer";
import styles from "../../styles/manager/managerTrips.module.css";

const ManagerTrips = () => {
  const [stats, setStats] = useState({
    totalTrips: 0,
    deliveredTrips: 0,
    activeTrips: 0,
    cancelledTrips: 0,
    pendingTrips: 0,
    totalRevenue: 0,
  });

  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  /* ==========================
     Load drivers & vehicles for filters
  ========================== */
  const loadFilters = async () => {
    try {
      setLoadingFilters(true);
      const [driversRes, vehiclesRes] = await Promise.all([
        getCompanyDriversApi(),
        getCompanyVehiclesApi(),
      ]);

      setDrivers(driversRes.data.drivers || []);
      setVehicles(vehiclesRes.data.vehicles || []);
    } catch (err) {
      console.error("Error loading filter data:", err);
    } finally {
      setLoadingFilters(false);
    }
  };

  /* ==========================
     Load stats
  ========================== */
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      setError("");

      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getManagerTripStatsApi(params);
      if (res.data?.ok && res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error loading trip stats:", err);
      setError("Failed to load trip statistics.");
    } finally {
      setLoadingStats(false);
    }
  };

  /* ==========================
     Load trips list
  ========================== */
  const loadTrips = async () => {
    try {
      setLoadingTrips(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (statusFilter) params.status = statusFilter;
      if (driverFilter) params.driverId = driverFilter;
      if (vehicleFilter) params.vehicleId = vehicleFilter;
      if (searchQuery) params.search = searchQuery;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getManagerTripsApi(params);

      if (res.data?.ok) {
        setTrips(res.data.trips || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error("Error loading trips:", err);
      setError("Failed to load trips.");
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  // Reload stats + trips when filters or page change
  useEffect(() => {
    loadStats();
    loadTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, driverFilter, vehicleFilter, searchQuery, startDate, endDate, page]);

  const openTripDrawer = (trip) => {
    setSelectedTrip(trip);
    setDrawerOpen(true);
  };

  const closeTripDrawer = () => {
    setSelectedTrip(null);
    setDrawerOpen(false);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  };

  const shortenId = (id) => {
    if (!id) return "";
    if (id.length <= 8) return id;
    return id.slice(-8);
  };

  const onResetFilters = () => {
    setStatusFilter("");
    setDriverFilter("");
    setVehicleFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Trips</h1>
          <p>
            Overview of all trips for your company: stats, filters, and detailed
            information.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={onResetFilters}
          >
            Reset Filters
          </button>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => {
              loadStats();
              loadTrips();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h3>Total Trips</h3>
          <p className={styles.number}>{stats.totalTrips || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Delivered</h3>
          <p className={styles.number}>{stats.deliveredTrips || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Active</h3>
          <p className={styles.number}>{stats.activeTrips || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Cancelled</h3>
          <p className={styles.number}>{stats.cancelledTrips || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Pending</h3>
          <p className={styles.number}>{stats.pendingTrips || 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Total Revenue</h3>
          <p className={styles.number}>
            {typeof stats.totalRevenue === "number"
              ? stats.totalRevenue.toFixed(2)
              : "0.00"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Driver */}
          <select
            value={driverFilter}
            onChange={(e) => {
              setDriverFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All drivers</option>
            {drivers.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Vehicle */}
          <select
            value={vehicleFilter}
            onChange={(e) => {
              setVehicleFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v._id} value={v._id}>
                {v.plateNumber} ({v.brand} {v.model})
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by address / phone / ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className={styles.filtersRow}>
          {/* Dates */}
          <div className={styles.dateGroup}>
            <label>From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className={styles.dateGroup}>
            <label>To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {loadingFilters && (
            <span className={styles.smallInfo}>Loading filters...</span>
          )}
          {loadingStats && (
            <span className={styles.smallInfo}>Updating stats...</span>
          )}
        </div>
      </div>

      {/* Trips Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Trips List</h3>
          {loadingTrips && (
            <span className={styles.smallInfo}>Loading trips...</span>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {trips.length === 0 && !loadingTrips ? (
          <p className={styles.empty}>No trips found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t._id}>
                    <td>#{shortenId(t._id)}</td>
                    <td>{t.customerId?.name || "—"}</td>
                    <td>{t.driverId?.name || "—"}</td>
                    <td>
                      {t.vehicleId
                        ? `${t.vehicleId.brand || ""} ${t.vehicleId.model || ""} (${t.vehicleId.plateNumber || ""})`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          styles[`badgeStatus_${t.status}`] || ""
                        }`}
                      >
                        {t.status === "in_progress"
                          ? "In Progress"
                          : t.status?.charAt(0).toUpperCase() +
                            t.status?.slice(1)}
                      </span>
                    </td>
                    <td>{t.paymentStatus || "unpaid"}</td>
                    <td>
                      {typeof t.totalAmount === "number"
                        ? t.totalAmount.toFixed(2)
                        : "0.00"}
                    </td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewBtn}
                        onClick={() => openTripDrawer(t)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className={styles.paginationRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() =>
              setPage((p) => (p < totalPages ? p + 1 : p))
            }
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Drawer */}
      <ManagerTripDrawer
        open={drawerOpen}
        onClose={closeTripDrawer}
        trip={selectedTrip}
      />
    </div>
  );
};

export default ManagerTrips;
