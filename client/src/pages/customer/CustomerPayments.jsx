import React, { useEffect, useState } from "react";
import { getCustomerHistoryTripsApi, getCustomerTripDetailsApi } from "../../api/customerTripsApi";
import CustomerTripDrawer from "../../components/customer/CustomerTripDrawer";

import styles from "../../styles/customer/payments.module.css";

const CustomerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCustomerHistoryTripsApi();

      if (res.data.ok) {
        const deliveredTrips = res.data.trips.filter(
          (t) => t.status === "delivered"
        );
        setPayments(deliveredTrips);
      } else {
        setError("Failed to load payments.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error loading payments.");
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (tripId) => {
    try {
      const res = await getCustomerTripDetailsApi(tripId);
      setSelectedTrip(res.data.trip);
      setDrawerOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className={styles.info}>Loading payment history…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  if (payments.length === 0)
    return <p className={styles.info}>No completed payments yet.</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Payment History</h1>
      <p className={styles.sub}>All your completed delivery payments</p>

      <div className={styles.grid}>
        {payments.map((trip) => (
          <div key={trip._id} className={styles.card}>
            <div className={styles.header}>
              <h3>Order #{String(trip._id).slice(-6)}</h3>
              <span className={styles.paidBadge}>
                {trip.paymentStatus === "paid" ? "PAID" : "UNPAID"}
              </span>
            </div>

            <p className={styles.line}>
              <strong>Date:</strong>{" "}
              {new Date(trip.createdAt).toLocaleString()}
            </p>

            <p className={styles.line}>
              <strong>Delivery Fee:</strong> ${trip.deliveryFee.toFixed(2)}
            </p>

            <p className={styles.line}>
              <strong>Order Total:</strong> $
              {(trip.totalAmount || 0).toFixed(2)}
            </p>

            <p className={styles.totalPayment}>
              <strong>Total Paid:</strong>{" "}
              ${(trip.deliveryFee + (trip.totalAmount || 0)).toFixed(2)}
            </p>

            <button
              className={styles.viewBtn}
              onClick={() => openDrawer(trip._id)}
            >
              View Order
            </button>
          </div>
        ))}
      </div>

      <CustomerTripDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        trip={selectedTrip}
      />
    </div>
  );
};

export default CustomerPayments;
