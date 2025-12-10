import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getDriverPaymentDetailsApi,
} from "../../api/driverApi";

import styles from "../../styles/driver/driverPaymentDetails.module.css";

const DriverPaymentDetails = () => {
  const { id } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPayment();
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      const res = await getDriverPaymentDetailsApi(id);
      setPayment(res.data.payment || res.data?.data || null);
    } catch (err) {
      console.error("Failed to load payment:", err);
      setError("Could not load payment details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!payment) return <p className={styles.empty}>Payment not found.</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Payment Details</h2>

      {/* ===========================
          BASIC INFO
      ============================ */}
      <div className={styles.card}>
        <h3>General Info</h3>
        <p><strong>Status:</strong> {payment.status}</p>
        <p><strong>Method:</strong> {payment.method}</p>
        <p><strong>Total Amount:</strong> {payment.totalAmount} {payment.currency}</p>
        <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
      </div>

      {/* ===========================
          EARNINGS
      ============================ */}
      <div className={styles.card}>
        <h3>Breakdown</h3>

        <p><strong>Delivery Fee:</strong> {payment.deliveryFee}</p>
        {payment.productTotal > 0 && (
          <p><strong>Product Total:</strong> {payment.productTotal}</p>
        )}

        <p><strong>Discount:</strong> {payment.discountAmount}</p>
        <p><strong>Tax:</strong> {payment.taxAmount}</p>
        <p><strong>Gateway Fee:</strong> {payment.gatewayFee}</p>

        <hr />

        <p><strong>Your Earning:</strong> {payment.driverEarning}</p>
        <p><strong>Company Earning:</strong> {payment.companyEarning}</p>
      </div>

      {/* ===========================
          TRIP INFORMATION
      ============================ */}
      <div className={styles.card}>
        <h3>Trip Info</h3>
        {payment.tripId ? (
          <>
            <p><strong>Trip ID:</strong> {payment.tripId._id}</p>
            <p><strong>Trip Status:</strong> {payment.tripId.status}</p>
            <p><strong>Delivery Fee:</strong> {payment.tripId.deliveryFee}</p>

            <a
              href={`/driver/trips/${payment.tripId._id}`}
              className={styles.viewTripBtn}
            >
              View Trip
            </a>
          </>
        ) : (
          <p>No trip data available</p>
        )}
      </div>
    </div>
  );
};

export default DriverPaymentDetails;
