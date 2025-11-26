// client/src/pages/manager/ManagerOrders.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerOrdersApi,
  getManagerOrdersSummaryApi,
} from "../../api/managerOrdersApi";
import ManagerOrderDrawer from "../../components/manager/ManagerOrderDrawer";
import styles from "../../styles/manager/managerOrders.module.css";

const ManagerOrders = () => {
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

  // UI state
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  // Summary
  const [summary, setSummary] = useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
      };

      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      if (minTotal) params.minTotal = minTotal;
      if (maxTotal) params.maxTotal = maxTotal;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await getManagerOrdersApi(params);

      const data = res.data || {};
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(
        err.response?.data?.error || "Failed to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, minTotal, maxTotal, startDate, endDate]);

  // Reload summary when date filters change
  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const openDrawer = (order) => {
    setSelectedOrder(order);
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

  const formatMoney = (value) => {
    if (typeof value !== "number") return "0.00";
    return value.toFixed(2);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
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

      {/* Summary cards */}
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
            {summaryLoading
              ? "…"
              : formatMoney(summary?.totalRevenue || 0)}
          </span>
        </div>
      </div>

      {/* Filters */}
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
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="assigned">Assigned</option>
          <option value="delivering">Delivering</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date range */}
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

        {/* Total range */}
        <input
          type="number"
          min="0"
          placeholder="Min total"
          value={minTotal}
          onChange={(e) => setMinTotal(e.target.value)}
        />
        <input
          type="number"
          min="0"
          placeholder="Max total"
          value={maxTotal}
          onChange={(e) => setMaxTotal(e.target.value)}
        />

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by ID, customer name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* Table */}
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
                        #{String(o._id).slice(-6)}
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
      <ManagerOrderDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        order={selectedOrder}
      />
    </div>
  );
};

export default ManagerOrders;
