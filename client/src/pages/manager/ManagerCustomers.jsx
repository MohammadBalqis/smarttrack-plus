// client/src/pages/manager/ManagerCustomers.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerCustomersApi,
  getManagerCustomerDetailsApi,
} from "../../api/managerCustomersApi";

import ManagerCustomerDrawer from "../../components/manager/ManagerCustomerDrawer";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [minTrips, setMinTrips] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const totalPages = Math.ceil(total / limit) || 1;

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (search.trim()) params.search = search.trim();
      if (minTrips) params.minTrips = minTrips;

      const res = await getManagerCustomersApi(params);

      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error loading customers:", err);
      const msg =
        err.response?.data?.error || "Failed to load customers. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, minTrips]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  const openDrawer = async (customerId) => {
    setSelectedCustomerId(customerId);
    setSelectedCustomerDetails(null);
    setLoadingDetails(true);
    setDrawerOpen(true);

    try {
      const res = await getManagerCustomerDetailsApi(customerId);
      setSelectedCustomerDetails(res.data);
    } catch (err) {
      console.error("Error loading customer details:", err);
      setSelectedCustomerDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomerId(null);
    setSelectedCustomerDetails(null);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Customers</h1>
          <p className={styles.subtitle}>
            Customers who placed trips with your company.
          </p>
        </div>
        <div className={styles.headerStats}>
          <span>
            Total customers: <strong>{total}</strong>
          </span>
          <span>
            Page: <strong>{page}</strong> / {totalPages}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <form className={styles.searchForm} onSubmit={submitSearch}>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className={styles.filtersRight}>
          <select
            value={minTrips}
            onChange={(e) => {
              setMinTrips(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All customers</option>
            <option value="1">At least 1 trip</option>
            <option value="3">At least 3 trips</option>
            <option value="5">At least 5 trips</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Customers List</h3>
          {loading && (
            <span className={styles.smallInfo}>Loading customers...</span>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && customers.length === 0 ? (
          <p className={styles.empty}>No customers found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Total Trips</th>
                  <th>Delivered</th>
                  <th>Cancelled</th>
                  <th>Last Trip</th>
                  <th>Estimated Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customerId}>
                    <td className={styles.customerCell}>
                      <div className={styles.customerInfo}>
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt={c.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {c.name?.[0] || "C"}
                          </div>
                        )}
                        <div>
                          <div>{c.name}</div>
                          <span
                            className={
                              c.isActive
                                ? styles.statusBadgeActive
                                : styles.statusBadgeInactive
                            }
                          >
                            {c.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.totalTrips}</td>
                    <td>{c.deliveredTrips}</td>
                    <td>{c.cancelledTrips}</td>
                    <td>{formatDate(c.lastTripAt)}</td>
                    <td>
                      $
                      {c.totalAmount?.toFixed
                        ? c.totalAmount.toFixed(2)
                        : Number(c.totalAmount || 0).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDrawer(c.customerId)}
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
        {totalPages > 1 && (
          <div className={styles.paginationRow}>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
                setPage((prev) => (prev < totalPages ? prev + 1 : prev))
              }
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      <ManagerCustomerDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        details={
          loadingDetails
            ? null
            : selectedCustomerDetails || { customer: null, stats: null, recentTrips: [] }
        }
      />
    </div>
  );
};

export default ManagerCustomers;
