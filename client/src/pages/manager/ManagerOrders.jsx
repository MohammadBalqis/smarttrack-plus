// client/src/pages/manager/ManagerOrders.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerOrdersApi,
  getManagerOrdersSummaryApi,
} from "../../api/managerOrdersApi";

import { useBranding } from "../../context/BrandingContext";
import ManagerOrderDrawer from "../../components/manager/ManagerOrderDrawer";
import styles from "../../styles/manager/managerOrders.module.css";

const ManagerOrders = () => {
  const { branding } = useBranding();

  // List + pagination
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  // Summary cards
  const [summary, setSummary] = useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ==========================================================
     LOAD ORDERS
  ========================================================== */
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit };

      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      if (minTotal) params.minTotal = minTotal;
      if (maxTotal) params.maxTotal = maxTotal;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getManagerOrdersApi(params);

      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading orders:", err);
      const msg =
        err.response?.data?.error || "Failed to load orders. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOAD SUMMARY
  ========================================================== */
  const loadSummary = async () => {
    try {
      setSummaryLoading(true);

      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getManagerOrdersSummaryApi(params);
      if (res.data?.ok) {
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error("Error loading order summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, minTotal, maxTotal, startDate, endDate]);

  useEffect(() => {
    loadSummary();
  }, [startDate, endDate]);

  /* ==========================================================
     HELPERS
  ========================================================== */

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const openDrawer = (o) => {
    setSelectedOrder(o);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedOrder(null);
    setDrawerOpen(false);
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return styles.badge_default;
    const key = `badge_${status}`;
    return styles[key] || styles.badge_default;
  };

  const formatMoney = (v) =>
    typeof v === "number" ? v.toFixed(2) : "0.00";

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const shortId = (id) =>
    id ? `#${String(id).slice(-6)}` : "#000000";

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>
            Monitor all orders for your company, from pending to delivered.
          </p>
        </div>

        <div className={styles.headerStats}>
          <span className={styles.headerStat}>
            Total orders: <strong>{total}</strong>
          </span>
          <span className={styles.headerStat}>
            Page: <strong>{page}</strong> / {totalPages}
          </span>
        </div>
      </div>

      {/* ================= SUMMARY CARDS ================= */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Delivered</span>
          <span className={styles.summaryNumber}>
            {summaryLoading ? "…" : summary?.deliveredCount ?? 0}
          </span>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Pending</span>
          <span className={styles.summaryNumber}>
            {summaryLoading ? "…" : summary?.pendingCount ?? 0}
          </span>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Cancelled</span>
          <span className={styles.summaryNumber}>
            {summaryLoading ? "…" : summary?.cancelledCount ?? 0}
          </span>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Revenue</span>
          <span className={styles.summaryNumber}>
            $
            {summaryLoading ? "…" : formatMoney(summary?.totalRevenue || 0)}
          </span>
        </div>
      </div>

      {/* ================= FILTERS ================= */}
      <div className={styles.filtersRow}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="assigned">Assigned</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date filters */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
        />

        {/* Total filters */}
        <input
          type="number"
          placeholder="Min total"
          value={minTotal}
          onChange={(e) => setMinTotal(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max total"
          value={maxTotal}
          onChange={(e) => setMaxTotal(e.target.value)}
        />

        {/* Search */}
        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by ID, customer name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" style={{ background: branding.primaryColor }}>
            Search
          </button>
        </form>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Orders List</h3>
          {loading && (
            <span className={styles.smallInfo}>Loading orders...</span>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && orders.length === 0 ? (
          <p className={styles.empty}>No orders found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th>Driver</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className={styles.orderIdCell}>
                      <span className={styles.orderId}>
                        {shortId(o._id)}
                      </span>
                    </td>

                    <td>
                      <div className={styles.customerCell}>
                        <span className={styles.customerName}>
                          {o.customerId?.name || "—"}
                        </span>
                        <span className={styles.customerEmail}>
                          {o.customerId?.email || ""}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={getStatusBadgeClass(o.status)}>
                        {o.status}
                      </span>
                    </td>

                    <td>${formatMoney(o.total || 0)}</td>

                    <td>{formatDateTime(o.createdAt)}</td>

                    <td>{o.driverId?.name || "—"}</td>

                    <td>
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDrawer(o)}
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
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ================= DRAWER ================= */}
      <ManagerOrderDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        order={selectedOrder}
      />
    </div>
  );
};

export default ManagerOrders;
