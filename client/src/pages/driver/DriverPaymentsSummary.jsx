import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getDriverPaymentsApi } from "../../api/driverApi";
import styles from "../../styles/driver/driverPaymentsSummary.module.css";

const DEFAULT_LIMIT = 200; // how many records to load per query

const DriverPaymentsSummary = () => {
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // all / paid / pending / failed / refunded
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================
     Load payments from API with filters
  ========================================= */
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: 1,
        limit: DEFAULT_LIMIT,
      };

      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.startDate = fromDate;
      if (toDate) params.endDate = toDate;

      const res = await getDriverPaymentsApi(params);

      const data =
        res.data?.payments ||
        res.data?.data ||
        res.data?.results ||
        [];

      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("DriverPaymentsSummary load error:", err);
      setError("Failed to load payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================================
     Derived summary from payments list
  ========================================= */
  const summary = useMemo(() => {
    if (!payments.length) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        totalDeliveryFees: 0,
        totalDriverEarning: 0,
        totalCompanyEarning: 0,
        totalRefunded: 0,
      };
    }

    let totalPayments = payments.length;
    let totalAmount = 0;
    let totalDeliveryFees = 0;
    let totalDriverEarning = 0;
    let totalCompanyEarning = 0;
    let totalRefunded = 0;

    payments.forEach((p) => {
      const amount = Number(p.totalAmount || 0);
      const delivery = Number(p.deliveryFee || 0);
      const driverEarn = Number(p.driverEarning || 0);
      const companyEarn = Number(p.companyEarning || 0);

      totalAmount += amount;
      totalDeliveryFees += delivery;
      totalDriverEarning += driverEarn;
      totalCompanyEarning += companyEarn;

      if (p.status === "refunded") {
        totalRefunded += amount;
      }
    });

    return {
      totalPayments,
      totalAmount,
      totalDeliveryFees,
      totalDriverEarning,
      totalCompanyEarning,
      totalRefunded,
    };
  }, [payments]);

  /* =========================================
     Chart data: group by payment status
  ========================================= */
  const chartData = useMemo(() => {
    const counts = {
      paid: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
    };

    payments.forEach((p) => {
      const st = p.status || "unknown";
      if (counts[st] !== undefined) {
        counts[st] += 1;
      }
    });

    return [
      { status: "paid", count: counts.paid },
      { status: "pending", count: counts.pending },
      { status: "failed", count: counts.failed },
      { status: "refunded", count: counts.refunded },
    ];
  }, [payments]);

  const handleApplyFilters = () => {
    loadPayments();
  };

  const formatCurrency = (value) => {
    if (!value || Number.isNaN(Number(value))) return "0";
    return Number(value).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.pageTitle}>Payments Summary</h1>
          <p className={styles.pageSubtitle}>
            Overview of your earnings and completed deliveries
          </p>
        </div>

        <div className={styles.headerMeta}>
          <span className={styles.chip}>
            Total payments: {summary.totalPayments}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>Status</label>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>From</label>
            <input
              type="date"
              className={styles.input}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>To</label>
            <input
              type="date"
              className={styles.input}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <button
              type="button"
              className={styles.refreshBtn}
              onClick={handleApplyFilters}
              disabled={loading}
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>
        <p className={styles.filterHint}>
          Filters run on the server via <code>/driver/payments</code> and are
          summarized here on the driver dashboard.
        </p>
      </div>

      {/* Summary cards */}
      <div className={styles.cardsGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>Total amount</div>
          <div className={styles.cardValue}>
            {formatCurrency(summary.totalAmount)}
          </div>
          <div className={styles.cardHint}>Sum of all payments</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Delivery fees</div>
          <div className={styles.cardValue}>
            {formatCurrency(summary.totalDeliveryFees)}
          </div>
          <div className={styles.cardHint}>Only delivery fee part</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Your earnings</div>
          <div className={styles.cardValue}>
            {formatCurrency(summary.totalDriverEarning)}
          </div>
          <div className={styles.cardHint}>Driver earning total</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardLabel}>Refunded</div>
          <div className={styles.cardValue}>
            {formatCurrency(summary.totalRefunded)}
          </div>
          <div className={styles.cardHint}>Total refunded payments</div>
        </div>
      </div>

      {/* Error / loading */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h2 className={styles.chartTitle}>Payments by status</h2>
          <span className={styles.chartHint}>
            Count of payments in current filter range
          </span>
        </div>

        {payments.length === 0 && !loading ? (
          <p className={styles.emptyText}>No payments found.</p>
        ) : (
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPaymentsSummary;
