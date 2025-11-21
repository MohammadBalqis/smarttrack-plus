import React, { useEffect, useState } from "react";
import { getCompanyTripsApi, getCompanyTripDetailsApi } from "../../api/companyTripsApi";
import TripDrawer from "../../components/company/TripDrawer";
import styles from "../../styles/company/companyTrips.module.css";

const CompanyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    from: "",
    to: "",
    driverId: "",
  });

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [page, filters]);

  const loadTrips = async () => {
    try {
      const res = await getCompanyTripsApi({
        page,
        ...filters,
      });

      setTrips(res.data.trips || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Error loading trips:", err);
    }
  };

  const openDrawer = async (tripId) => {
    try {
      const res = await getCompanyTripDetailsApi(tripId);
      setSelectedTrip(res.data.trip);
      setDrawerOpen(true);
    } catch (err) {
      console.error("Error loading trip details:", err);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedTrip(null);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Trips</h2>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />

        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
      </div>

      {/* Trips Table */}
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
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {trips.map((t) => (
              <tr key={t._id}>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
                <td>{t.driverId?.name || "Unassigned"}</td>
                <td>{t.pickupLocation?.address}</td>
                <td>{t.dropoffLocation?.address}</td>
                <td>
                  <span className={styles[`badge_${t.status}`]}>
                    {t.status}
                  </span>
                </td>
                <td>${t.totalAmount?.toFixed(2)}</td>
                <td>
                  <button
                    className={styles.viewBtn}
                    onClick={() => openDrawer(t._id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trips.length === 0 && <p className={styles.empty}>No trips found.</p>}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <span>
          Page {page} / {pages}
        </span>
        <button disabled={page === pages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>

      {/* Trip Drawer */}
      <TripDrawer open={drawerOpen} onClose={closeDrawer} trip={selectedTrip} />
    </div>
  );
};

export default CompanyTrips;
