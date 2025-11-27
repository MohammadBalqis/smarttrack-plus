// client/src/pages/manager/ManagerPayments.jsx
import React, { useEffect, useState } from "react";
import {
  getCompanyPaymentsApi,
  getCompanyPaymentsSummaryApi,
  getPaymentDetailsApi,
} from "../../api/companyPaymentsApi";

import ManagerPaymentDrawer from "../../components/manager/ManagerPaymentDrawer";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerPayments.module.css";

const ManagerPayments = () => {
  const { branding } = useBranding();

  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const pageLimit = 15;

  /* ==========================================================
     LOAD SUMMARY
  ========================================================== */
  const loadSummary = async () => {
    try {
      setLoadingSummary(true);
      const params = {};

      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await getCompanyPaymentsSummaryApi(params);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error("Error loading payments summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  /* ==========================================================
     LOAD PAYMENTS LIST
  ========================================================== */
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page, limit: pageLimit };

      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.method = methodFilter;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await getCompanyPaymentsApi(params);
      setPayments(res.data.payments || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error loading payments:", err);
      setError("Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, methodFilter, search, dateFrom, dateTo]);

  /* ==========================================================
     HELPERS
  ========================================================== */
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  /* ==========================================================
     DRAWER HANDLING
  ========================================================== */
  const handleOpenDrawer = async (paymentId) => {
    try {
      setLoadingDetails(true);
      setDrawerOpen(true);

      const res = await getPaymentDetailsApi(paymentId);
      setSelectedPayment(res.data.payment || null);
    } catch (err) {
      console.error("Error loading payment details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedPayment(null);
  };

  /* ==========================================================
     RESET FILTERS
  ========================================================== */
  const handleResetFilters = () => {
    setStatusFilter("");
    setMethodFilter("");
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Payments</h1>
        <p>Overview of all payments for your company.</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Payments</h3>
          <p>{loadingSummary ? "…" : summary?.totalPayments ?? 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Amount</h3>
          <p>
            {loadingSummary
              ? "…"
              : formatCurrency(summary?.totalAmount || 0)}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Company Earning</h3>
          <p>
            {loadingSummary
              ? "…"
              : formatCurrency(summary?.totalCompanyEarning || 0)}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Driver Earning</h3>
          <p>
            {loadingSummary
              ? "…"
              : formatCurrency(summary?.totalDriverEarning || 0)}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Platform Earning</h3>
          <p>
            {loadingSummary
              ? "…"
              : formatCurrency(summary?.totalPlatformEarning || 0)}
          </p>
        </div>

        <div className={styles.statCard}>
          <h3>Refunded Payments</h3>
          <p>{loadingSummary ? "…" : summary?.refundedCount ?? 0}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersRow}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) => {
            setMethodFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All methods</option>
          <option value="cod">Cash on Delivery</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="wallet">Wallet</option>
          <option value="wish_money">Wish Money</option>
          <option value="manual">Manual</option>
        </select>

        <input
          type="text"
          placeholder="Search by trip, customer, driver..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
        />

        <button
          type="button"
          onClick={handleResetFilters}
          className={styles.resetBtn}
          style={{ backgroundColor: branding.primaryColor }}
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3>Payments List</h3>
          {loading && <span className={styles.smallInfo}>Loading…</span>}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {payments.length === 0 && !loading ? (
          <p className={styles.empty}>No payments found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trip</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>{formatDate(p.paidAt || p.createdAt)}</td>
                    <td>{p.tripId?._id || p.tripId || "—"}</td>
                    <td>{p.customerId?.name || "—"}</td>
                    <td>{p.driverId?.name || "—"}</td>

                    <td>
                      <span className={styles.methodBadge}>{p.method}</span>
                    </td>

                    <td>
                      <span className={styles.statusBadge}>{p.status}</span>
                    </td>

                    <td>{formatCurrency(p.totalAmount || 0)}</td>

                    <td>
                      <button
                        className={styles.viewBtn}
                        type="button"
                        onClick={() => handleOpenDrawer(p._id)}
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
        <div className={styles.pagination}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      </div>

      {/* DRAWER */}
      <ManagerPaymentDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        payment={selectedPayment}
      />

      {/* LOADING OVERLAY */}
      {loadingDetails && drawerOpen && (
        <div className={styles.loadingOverlay}>Loading details…</div>
      )}
    </div>
  );
};

export default ManagerPayments;
