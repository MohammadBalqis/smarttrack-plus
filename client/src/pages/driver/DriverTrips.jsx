// client/src/pages/driver/DriverTrips.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDriverTripsApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverTrips.module.css";

/* ==========================================================
   STATUS OPTIONS
========================================================== */
const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In Progress" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

/* Badge classes */
const statusClass = (status) => {
  switch (status) {
    case "pending":
      return styles.badgePending;
    case "assigned":
      return styles.badgeAssigned;
    case "in_progress":
      return styles.badgeInProgress;
    case "delivered":
      return styles.badgeDelivered;
    case "cancelled":
      return styles.badgeCancelled;
    default:
      return styles.badgeDefault;
  }
};

const DriverTrips = () => {
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD TRIPS
  ========================================================== */
  const loadTrips = async (overridePage) => {
    try {
      setLoading(true);
      setError("");

      const currentPage = overridePage || page;

      const params = {
        page: currentPage,
        limit: 10,
      };

      if (status !== "all") params.status = status;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await getDriverTripsApi(params);

      const data = res.data || {};
      setTrips(data.trips || []);
      setPage(data.page || currentPage);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load driver trips:", err);
      setError("Failed to load trips. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, from, to]);

  /* ==========================================================
     HELPERS
  ========================================================== */
  const handleResetFilters = () => {
    setStatus("all");
    setFrom("");
    setTo("");
  };

  const handleViewTrip = (tripId) => {
    // open the trip details (you already wired this route)
    navigate(`/driver/trips/${tripId}`);
  };

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const formatMoney = (v) => (v == null ? "0.00" : Number(v).toFixed(2));

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>My Trips</h1>
          <p className={styles.subtitle}>
            Manage and review all your deliveries with filters &amp; live status.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => loadTrips(page)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={styles.select}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetFilters}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Table */}
      <div className={styles.card}>
        {loading && trips.length === 0 ? (
          <p className={styles.infoText}>Loading trips...</p>
        ) : trips.length === 0 ? (
          <p className={styles.infoText}>No trips found for these filters.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trip</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Company</th>
                <th>Fee</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {trips.map((trip) => (
                <tr key={trip._id}>
                  <td className={styles.tripIdCell}>
                    #{String(trip._id).slice(-6)}
                  </td>

                  <td>
                    <span className={statusClass(trip.status)}>
                      {trip.status}
                    </span>
                    {trip.liveStatus && (
                      <div className={styles.liveStatus}>{trip.liveStatus}</div>
                    )}
                  </td>

                  <td>
                    {trip.customerId?.name || "—"}
                    {trip.customerId?.phone && (
                      <div className={styles.subText}>
                        {trip.customerId.phone}
                      </div>
                    )}
                  </td>

                  <td>{trip.companyId?.name || "—"}</td>

                  <td>
                    {formatMoney(trip.deliveryFee)}{" "}
                    <span className={styles.subText}>
                      {trip.currency || "USD"}
                    </span>
                  </td>

                  <td>{formatDateTime(trip.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleViewTrip(trip._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => loadTrips(page - 1)}
            >
              ‹ Prev
            </button>

            <span className={styles.pageInfo}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => loadTrips(page + 1)}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverTrips;
