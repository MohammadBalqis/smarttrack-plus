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

  /* ===================== STATE ===================== */

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Tabs
  const [activeTab, setActiveTab] = useState("pending"); // pending | assigned

  // Filters
  const [search, setSearch] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");

  // Summary
  const [summary, setSummary] = useState(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  /* ===================== LOAD ORDERS ===================== */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page,
        limit,
        status: activeTab, // 🔑 key change
      };

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
      setError(
        err.response?.data?.error ||
          "Failed to load orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===================== LOAD SUMMARY ===================== */

  const loadSummary = async () => {
    try {
      setSummaryLoading(true);
      const res = await getManagerOrdersSummaryApi({});
      if (res.data?.ok) setSummary(res.data.summary);
    } catch (err) {
      console.error("Error loading summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, activeTab, minTotal, maxTotal, startDate, endDate]);

  useEffect(() => {
    loadSummary();
  }, []);

  /* ===================== HELPERS ===================== */

  const openDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setSelectedOrder(null);
    setDrawerOpen(false);
  };

  const shortId = (id) =>
    id ? `#${String(id).slice(-6)}` : "#000000";

  const formatMoney = (v) =>
    typeof v === "number" ? v.toFixed(2) : "0.00";

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const getStatusBadgeClass = (status) =>
    styles[`badge_${status}`] || styles.badge_default;

  /* ===================== RENDER ===================== */

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Orders Dispatch</h1>
          <p className={styles.subtitle}>
            Assign drivers and monitor live orders.
          </p>
        </div>
      </div>

      {/* ================= SUMMARY ================= */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>Pending</span>
          <strong>{summaryLoading ? "…" : summary?.pendingCount ?? 0}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Delivered</span>
          <strong>{summaryLoading ? "…" : summary?.deliveredCount ?? 0}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Revenue</span>
          <strong>${formatMoney(summary?.totalRevenue || 0)}</strong>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className={styles.tabs}>
        <button
          className={activeTab === "pending" ? styles.activeTab : ""}
          onClick={() => {
            setActiveTab("pending");
            setPage(1);
          }}
        >
          Pending Orders
        </button>
        <button
          className={activeTab === "assigned" ? styles.activeTab : ""}
          onClick={() => {
            setActiveTab("assigned");
            setPage(1);
          }}
        >
          Assigned Orders
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className={styles.tableCard}>
        {loading ? (
          <p className={styles.smallInfo}>Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>No orders found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Created</th>
                <th>Driver</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{shortId(o._id)}</td>
                  <td>{o.customerId?.name || "—"}</td>
                  <td>
                    <span className={getStatusBadgeClass(o.status)}>
                      {o.status}
                    </span>
                  </td>
                  <td>${formatMoney(o.total)}</td>
                  <td>{formatDateTime(o.createdAt)}</td>
                  <td>{o.driverId?.name || "—"}</td>
                  <td>
                    <button
                      onClick={() => openDrawer(o)}
                      className={styles.viewButton}
                      style={{ background: branding.primaryColor }}
                    >
                      {o.status === "pending" ? "Assign" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= DRAWER ================= */}
      <ManagerOrderDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        order={selectedOrder}
        onUpdated={loadOrders}
      />
    </div>
  );
};

export default ManagerOrders;
