import React, { useEffect, useState } from "react";
import {
  getOwnerBillingOverviewApi,
  getOwnerInvoicesApi,
  getOwnerCompaniesActivityApi,
} from "../../api/ownerApi";

import styles from "../../styles/systemOwner/ownerBilling.module.css";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const OwnerBilling = () => {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState({
    totalInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    estimatedMRR: 0,
  });

  const [companies, setCompanies] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [statusFilter, setStatusFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");

  const [error, setError] = useState("");

  /* ==========================================================
     HELPERS
  ========================================================== */

  const formatMoney = (v) =>
    v == null ? "0.00" : Number(v).toFixed(2);

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const formatPeriod = (inv) => {
    if (!inv?.periodStart || !inv?.periodEnd) return "—";
    const start = formatDate(inv.periodStart);
    const end = formatDate(inv.periodEnd);
    return `${start} → ${end}`;
  };

  const statusClass = (status) => {
    const base = styles.statusBadge;
    switch (status) {
      case "pending":
        return `${base} ${styles.statusPending}`;
      case "paid":
        return `${base} ${styles.statusPaid}`;
      case "overdue":
        return `${base} ${styles.statusOverdue}`;
      case "cancelled":
        return `${base} ${styles.statusCancelled}`;
      default:
        return base;
    }
  };

  /* ==========================================================
     LOAD ALL DATA
  ========================================================== */

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [ovRes, compRes, invRes] = await Promise.all([
        getOwnerBillingOverviewApi(),
        getOwnerCompaniesActivityApi(),
        getOwnerInvoicesApi({
          status: statusFilter || undefined,
          companyId: companyFilter || undefined,
        }),
      ]);

      setOverview(ovRes.data || {});
      setCompanies(compRes.data?.companies || []);
      setInvoices(invRes.data?.invoices || []);
    } catch (err) {
      console.error("OwnerBilling load error:", err);
      const msg =
        err?.response?.data?.error ||
        "Failed to load billing data. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, companyFilter]);

  const handleResetFilters = () => {
    setStatusFilter("");
    setCompanyFilter("");
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Billing & Invoices</h1>
          <p className={styles.subtitle}>
            Monitor your subscription revenue, MRR and invoice status across all companies.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshBtn}
          onClick={loadAll}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* KPI CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Invoices</p>
          <p className={styles.statValue}>
            {overview.totalInvoices ?? 0}
          </p>
          <p className={styles.statHint}>All time</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Pending</p>
          <p className={styles.statValue}>
            {overview.pendingInvoices ?? 0}
          </p>
          <p className={styles.statHint}>Awaiting payment</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Overdue</p>
          <p className={styles.statValue}>
            {overview.overdueInvoices ?? 0}
          </p>
          <p className={styles.statHint}>Past due date</p>
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Estimated MRR</p>
          <p className={styles.statValue}>
            ${formatMoney(overview.estimatedMRR)}
          </p>
          <p className={styles.statHint}>
            Based on current driver counts & tiers
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Company</label>
          <select
            className={styles.select}
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Invoices</h2>
          <p className={styles.cardSub}>
            Monthly subscription invoices generated from driver-based tiers.
          </p>
        </div>

        {invoices.length === 0 ? (
          <div className={styles.emptyBox}>
            {loading
              ? "Loading invoices..."
              : "No invoices found for these filters."}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Company</th>
                  <th>Period</th>
                  <th>Drivers</th>
                  <th>Tier</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td className={styles.invoiceId}>
                      #{String(inv._id).slice(-6)}
                    </td>

                    <td>
                      <div className={styles.companyName}>
                        {inv.companyId?.name || "—"}
                      </div>
                      <div className={styles.companyMeta}>
                        {inv.companyId?.email || ""}
                      </div>
                    </td>

                    <td>
                      <div className={styles.periodText}>
                        {formatPeriod(inv)}
                      </div>
                    </td>

                    <td>{inv.driverCount ?? 0}</td>

                    <td>{inv.tier || "—"}</td>

                    <td className={styles.amount}>
                      {inv.amount != null ? formatMoney(inv.amount) : "0.00"}{" "}
                      {inv.currency || "USD"}
                    </td>

                    <td>
                      <span className={statusClass(inv.status)}>
                        {inv.status}
                      </span>
                    </td>

                    <td>{formatDate(inv.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBilling;
