import React, { useEffect, useState } from "react";
import { getDriverPaymentsApi } from "../../api/driverApi";

import styles from "../../styles/driver/driverPayments.module.css";

const DriverPayments = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const res = await getDriverPaymentsApi();
      setPayments(res.data.payments);
    } catch (err) {
      console.error("Failed loading payments:", err);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Earnings</h1>

      <div className={styles.card}>
        {payments.length === 0 ? (
          <p>No payment records found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Payment</th>
                <th>Amount</th>
                <th>Trip</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td>{p._id.slice(-6)}</td>
                  <td>${p.amount?.toFixed(2)}</td>
                  <td>{p.tripId?.slice(-6)}</td>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DriverPayments;
