// client/src/pages/manager/ManagerCustomers.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerCustomersApi,
  getManagerCustomerDetailsApi,
} from "../../api/managerCustomersApi";

import ManagerCustomerDrawer from "../../components/manager/ManagerCustomerDrawer";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerCustomers.module.css";

const ManagerCustomers = () => {
  const { branding } = useBranding();

  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [search, setSearch] = useState("");
  const [minTrips, setMinTrips] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const totalPages = Math.ceil(total / limit) || 1;

  /* ============================================================
     LOAD CUSTOMERS
  ============================================================ */
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit };
      if (search.trim()) params.search = search.trim();
      if (minTrips) params.minTrips = minTrips;

      const res = await getManagerCustomersApi(params);

      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError(
        err.response?.data?.error ||
          "Failed to load customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, minTrips]);

  const submitSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadCustomers();
  };

  /* ============================================================
     OPEN DRAWER (LOAD DETAILS)
  ============================================================ */
  const openDrawer = async (customerId) => {
    setDrawerOpen(true);
    setSelectedCustomerId(customerId);
    setSelectedDetails(null);
    setLoadingDetails(true);

    try {
      const res = await getManagerCustomerDetailsApi(customerId);
      setSelectedDetails(res.data);
    } catch (err) {
      console.error(err);
      setSelectedDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomerId(null);
    setSelectedDetails(null);
  };

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? "—" : d.toLocaleDateString();
  };

  const formatMoney = (v) => {
    if (typeof v === "number") return `$${v.toFixed(2)}`;
    const num = Number(v || 0);
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title} style={{ color: branding.primaryColor }}>
            Customers
          </h1>
          <p className={styles.subtitle}>
            Customers who placed trips or orders with your company.
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

      {/* FILTERS */}
      <div className={styles.filtersRow}>
        <form className={styles.searchForm} onSubmit={submitSearch}>
          <input
            type="text"
            placeholder="Search name / phone / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ background: branding.primaryColor }}>
            Search
          </button>
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

      {/* TABLE */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Customers List</h3>
          {loading && <span className={styles.smallInfo}>Loading...</span>}
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
                  <th>Total Spent</th>
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
                            className={styles.avatar}
                            alt="avatar"
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {c.name?.charAt(0) || "C"}
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
                    <td>{formatMoney(c.totalAmount)}</td>

                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDrawer(c.customerId)}
                        style={{ background: branding.primaryColor }}
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

        {/* PAGINATION */}
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

      {/* DRAWER */}
      <ManagerCustomerDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        loading={loadingDetails}
        details={
          loadingDetails
            ? null
            : selectedDetails || {
                customer: null,
                stats: null,
                trips: [],
              }
        }
      />
    </div>
  );
};

export default ManagerCustomers;
