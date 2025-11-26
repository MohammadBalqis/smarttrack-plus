// client/src/pages/company/CompanyPayments.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyPaymentsApi,
  getCompanyPaymentDetailsApi,
} from "../../api/companyPaymentsApi";

import CompanyPaymentDrawer from "../../components/company/CompanyPaymentDrawer";
import styles from "../../styles/company/companyPayments.module.css";

const CompanyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({});

  // Filters
  const [status, setStatus] = useState("");
  const [method, setMethod] = useState("");
  const [driverId, setDriverId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 20;

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  /* ==========================================================
     LOAD PAYMENTS
  ========================================================== */
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit };

      if (status) params.status = status;
      if (method) params.method = method;
      if (driverId.trim()) params.driverId = driverId.trim();
      if (customerId.trim()) params.customerId = customerId.trim();
      if (from) params.from = from;
      if (to) params.to = to;
      if (search.trim()) params.search = search.trim();

      const res = await getCompanyPaymentsApi(params);

      setPayments(res.data.payments || []);
      setTotal(res.data.total || 0);

      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error("Payment load error:", err);
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page, status, method, driverId, customerId, from, to]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadPayments();
  };

  const openDrawer = async (payment) => {
    try {
      const res = await getCompanyPaymentDetailsApi(payment._id);
      setSelectedPayment(res.data.payment || payment);
    } catch (err) {
      console.error("Payment drawer error:", err);
      setSelectedPayment(payment);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedPayment(null);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Payments</h1>
        <p>Review and manage customer payments, revenue, and earnings.</p>
      </div>

      {/* ==========================================================
         SUMMARY CARDS
      ========================================================== */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <h4>Total Payments</h4>
          <p>{summary?.totalPayments ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Paid</h4>
          <p>{summary?.paidCount ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Pending</h4>
          <p>{summary?.pendingCount ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Failed</h4>
          <p>{summary?.failedCount ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Total Revenue</h4>
          <p>${(summary?.totalRevenue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* ==========================================================
         FILTERS
      ========================================================== */}
      <div className={styles.filtersRow}>
        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        {/* Method */}
        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Methods</option>
          <option value="cod">Cash on Delivery</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="wallet">Wallet</option>
          <option value="wish_money">Wish Money</option>
        </select>

        {/* Driver filter */}
        <input
          type="text"
          placeholder="Driver ID..."
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        />

        {/* Customer filter */}
        <input
          type="text"
          placeholder="Customer ID..."
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />

        {/* Date filters */}
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />

        {/* Search by payment ID */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search payment ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      {/* ==========================================================
         TABLE
      ========================================================== */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Payments List</h3>
          {loading && <span className={styles.smallInfo}>Loading...</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {!loading && payments.length === 0 ? (
          <p className={styles.empty}>No payments found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>{p._id}</td>
                    <td>{p.status}</td>
                    <td>${p.totalAmount?.toFixed(2) || "0.00"}</td>
                    <td>{p.method}</td>
                    <td>{p.customerId?.name || "—"}</td>
                    <td>{p.driverId?.name || "—"}</td>
                    <td>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td>
                      <button
                        className={styles.viewBtn}
                        onClick={() => openDrawer(p)}
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>

            <span>
              Page {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Drawer */}
      <CompanyPaymentDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        payment={selectedPayment}
      />
    </div>
  );
};

export default CompanyPayments;
