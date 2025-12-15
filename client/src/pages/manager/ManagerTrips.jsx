import React, { useEffect, useState } from "react";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import { getCompanyVehiclesApi } from "../../api/companyVehiclesApi";
import {
  getManagerTripsApi,
  getManagerTripStatsApi,
} from "../../api/managerTripsApi";
import ManagerTripDrawer from "../../components/manager/ManagerTripDrawer";
import styles from "../../styles/manager/managerTrips.module.css";

const ACTIVE_STATUSES = ["assigned", "in_progress"];

const ManagerTrips = () => {
  /* ==========================
     KPI STATS (UNCHANGED)
  ========================== */
  const [stats, setStats] = useState({
    totalTrips: 0,
    deliveredTrips: 0,
    activeTrips: 0,
    cancelledTrips: 0,
    pendingTrips: 0,
    totalRevenue: 0,
  });

  /* ==========================
     DATA
  ========================== */
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  /* ==========================
     FILTERS
  ========================== */
  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ==========================
     PAGINATION
  ========================== */
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  /* ==========================
     UI STATE
  ========================== */
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(false);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  /* ==========================
     HELPERS
  ========================== */
  const formatDate = (v) => (v ? new Date(v).toLocaleString() : "—");

  const calcDuration = (trip) => {
    if (!trip?.startTime || !trip?.confirmationTime) return "—";
    const diff = new Date(trip.confirmationTime) - new Date(trip.startTime);
    if (diff <= 0) return "—";
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}m ${sec}s`;
  };

  const driverActiveCount = (driverId) =>
    trips.filter(
      (t) =>
        t.driverId?._id === driverId &&
        ACTIVE_STATUSES.includes(t.status)
    ).length;

  /* ==========================
     LOAD FILTER DATA
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
    } finally {
      setLoadingFilters(false);
    }
  };

  /* ==========================
     LOAD STATS (UNCHANGED)
  ========================== */
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const res = await getManagerTripStatsApi({});
      if (res.data?.ok) setStats(res.data.stats);
    } finally {
      setLoadingStats(false);
    }
  };

  /* ==========================
     LOAD ACTIVE TRIPS ONLY
  ========================== */
  const loadTrips = async () => {
    try {
      setLoadingTrips(true);
      setError("");

      const params = {
        page,
        limit,
        status: ACTIVE_STATUSES.join(","), // ✅ IMPORTANT
      };

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
    } catch {
      setError("Failed to load trips.");
    } finally {
      setLoadingTrips(false);
    }
  };

  /* ==========================
     EFFECTS
  ========================== */
  useEffect(() => {
    loadFilters();
    loadStats();
  }, []);

  useEffect(() => {
    loadTrips();
    // eslint-disable-next-line
  }, [driverFilter, vehicleFilter, searchQuery, startDate, endDate, page]);

  /* ==========================
     DRAWER
  ========================== */
  const openTripDrawer = (trip) => {
    setSelectedTrip(trip);
    setDrawerOpen(true);
  };

  const closeTripDrawer = () => {
    setSelectedTrip(null);
    setDrawerOpen(false);
  };

  /* ==========================
     RESET FILTERS
  ========================== */
  const resetFilters = () => {
    setDriverFilter("");
    setVehicleFilter("");
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  /* ==========================
     RENDER
  ========================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Active Trips</h1>
          <p>Live overview of drivers currently delivering orders.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={resetFilters}>
            Reset
          </button>
          <button className={styles.refreshBtn} onClick={loadTrips}>
            Refresh
          </button>
        </div>
      </div>

      {/* KPI CARDS (UNCHANGED) */}
      <div className={styles.kpiGrid}>
        <div className={styles.card}><h3>Total</h3><p>{stats.totalTrips}</p></div>
        <div className={styles.card}><h3>Active</h3><p>{stats.activeTrips}</p></div>
        <div className={styles.card}><h3>Delivered</h3><p>{stats.deliveredTrips}</p></div>
        <div className={styles.card}><h3>Cancelled</h3><p>{stats.cancelledTrips}</p></div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersCard}>
        <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>

        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
          <option value="">All vehicles</option>
          {vehicles.map((v) => (
            <option key={v._id} value={v._id}>
              {v.plateNumber}
            </option>
          ))}
        </select>

        <input
          placeholder="Search address / customer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        {error && <p className={styles.error}>{error}</p>}

        {trips.length === 0 && !loadingTrips ? (
          <p className={styles.empty}>No active trips.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Duration</th>
                <th>Driver Load</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t._id}>
                  <td>{t.driverId?.name}</td>
                  <td>{t.vehicleId?.plateNumber || "—"}</td>
                  <td>{t.customerId?.name}</td>
                  <td>{t.dropoffLocation?.address || "—"}</td>
                  <td>{calcDuration(t)}</td>
                  <td>{driverActiveCount(t.driverId?._id)} active</td>
                  <td>
                    <button className={styles.viewBtn} onClick={() => openTripDrawer(t)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ManagerTripDrawer
        open={drawerOpen}
        onClose={closeTripDrawer}
        trip={selectedTrip}
      />
    </div>
  );
};

export default ManagerTrips;
