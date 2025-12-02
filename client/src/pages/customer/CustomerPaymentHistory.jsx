// client/src/pages/customer/CustomerPaymentHistory.jsx
import React, { useEffect, useState } from "react";
import {
  getCustomerPaymentsApi,
  getCustomerPaymentDetailsApi,
} from "../../api/customerPaymentsApi";

import CustomerPaymentDrawer from "../../components/customer/CustomerPaymentDrawer";
import styles from "../../styles/customer/payments.module.css";

const CustomerPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await getCustomerPaymentsApi();

      if (res.data.ok) {
        setPayments(res.data.payments || []);
        setFiltered(res.data.payments || []);
      } else {
        setError("Failed to load payments.");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  // FILTER
  const applyFilter = (value) => {
    setFilter(value);

    if (value === "all") return setFiltered(payments);

    setFiltered(payments.filter((p) => p.status === value));
  };

  // SEARCH
  const applySearch = (value) => {
    setSearch(value);

    let list = [...payments];

    if (filter !== "all") {
      list = list.filter((p) => p.status === filter);
    }

    if (value.trim() !== "") {
      list = list.filter(
        (p) =>
          p.transactionId?.toLowerCase().includes(value.toLowerCase()) ||
          p.companyId?.name?.toLowerCase().includes(value.toLowerCase())
      );
    }

    setFiltered(list);
  };

  // DRAWER
  const openDrawer = async (paymentId) => {
    try {
      const res = await getCustomerPaymentDetailsApi(paymentId);
      if (res.data.ok) {
        setSelectedPayment(res.data.payment);
        setDrawerOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p className={styles.info}>Loading payment history…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment History</h1>
      <p className={styles.sub}>All your successful and pending payments.</p>

      {/* FILTER ROW */}
      <div className={styles.filterRow}>
        <button
          className={filter === "all" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("all")}
        >
          All
        </button>

        <button
          className={filter === "paid" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("paid")}
        >
          Paid
        </button>

        <button
          className={filter === "pending" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("pending")}
        >
          Pending
        </button>

        <button
          className={filter === "unpaid" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("unpaid")}
        >
          Unpaid
        </button>

        <button
          className={filter === "refunded" ? styles.filterActive : styles.filterBtn}
          onClick={() => applyFilter("refunded")}
        >
          Refunded
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search by transaction ID or company name…"
          value={search}
          onChange={(e) => applySearch(e.target.value)}
        />
      </div>

      {/* LIST EMPTY */}
      {filtered.length === 0 && (
        <p className={styles.info}>No payments found matching this filter.</p>
      )}

      {/* GRID */}
      <div className={styles.grid}>
        {filtered.map((payment) => (
          <div key={payment._id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>#{String(payment._id).slice(-6)}</h3>

              <span
                className={
                  styles[`status_${payment.status}`] ||
                  styles.status_default
                }
              >
                {payment.status}
              </span>
            </div>

            <p className={styles.line}>
              <strong>Company:</strong> {payment.companyId?.name || "N/A"}
            </p>

            <p className={styles.line}>
              <strong>Amount:</strong> ${payment.amount?.toFixed(2)}
            </p>

            <p className={styles.line}>
              <strong>Date:</strong>{" "}
              {new Date(payment.createdAt).toLocaleString()}
            </p>

            <button
              className={styles.viewBtn}
              onClick={() => openDrawer(payment._id)}
            >
              View Payment
            </button>
          </div>
        ))}
      </div>

      {/* DRAWER */}
      <CustomerPaymentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default CustomerPaymentHistory;
