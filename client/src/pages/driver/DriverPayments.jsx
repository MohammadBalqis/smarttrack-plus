// client/src/pages/driver/DriverPayments.jsx
import React, { useEffect, useState } from "react";
import { getDriverPaymentsApi } from "../../api/driverApi";
import styles from "../../styles/driver/driverPayments.module.css";

const DriverPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ==========================================================
     Load Payments
  ========================================================== */
  const loadPayments = async () => {
    try {
      setLoading(true);

      const res = await getDriverPaymentsApi({
        status,
        startDate,
        endDate,
        page,
        limit: 10,
      });

      const data = res.data;

      setPayments(data.payments || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to load driver payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadPayments();
  };

  const clearFilters = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
    loadPayments();
  };

  const formatCurrency = (value) =>
    typeof value === "number"
      ? value.toLocaleString("en-US", { minimumFractionDigits: 2 })
      : value;

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleString();
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>💰 Your Payments</h2>

      {/* ==========================================================
          FILTERS
      ========================================================== */}
      <div className={styles.filters}>
        <select
          className={styles.input}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <input
          type="date"
          className={styles.input}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />

        <input
          type="date"
          className={styles.input}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />

        <button onClick={handleFilter} className={styles.filterBtn}>
          Apply
        </button>

        <button onClick={clearFilters} className={styles.clearBtn}>
          Clear
        </button>
      </div>

      {/* ==========================================================
          TABLE
      ========================================================== */}
      <div className={styles.tableBox}>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : payments.length === 0 ? (
          <p className={styles.noData}>No payments found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Status</th>
                <th>Total</th>
                <th>Driver Earning</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p.tripId?._id || p.tripId}</td>
                  <td className={styles.statusCell}>
                    <span
                      className={`${styles.status} ${
                        styles[p.status] || ""
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td>${formatCurrency(p.totalAmount)}</td>
                  <td>${formatCurrency(p.driverEarning)}</td>
                  <td>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ==========================================================
          PAGINATION
      ========================================================== */}
      <div className={styles.pagination}>
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className={styles.pageBtn}
        >
          ◀ Prev
        </button>

        <span className={styles.pageInfo}>
          Page {page} / {totalPages}
        </span>

        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className={styles.pageBtn}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
};

export default DriverPayments;
