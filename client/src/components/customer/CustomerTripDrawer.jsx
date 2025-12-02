// client/src/components/customer/CustomerTripDrawer.jsx
import React from "react";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import { useNavigate } from "react-router-dom";
import styles from "../../styles/customer/tripDrawer.module.css";

const CustomerTripDrawer = ({ open, onClose, trip }) => {
  const navigate = useNavigate();

  if (!open || !trip) return null;

  const status = trip.status || "pending";

  const isActive =
    status === "pending" || status === "assigned" || status === "in_progress";
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled";

  /* ==========================================================
     STATUS TIMELINE (Dynamic)
  ========================================================== */
  const timelineSteps = [
    { key: "pending", label: "Waiting for a Driver" },
    { key: "assigned", label: "Driver Assigned" },
    { key: "in_progress", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentStepIndex = timelineSteps.findIndex((s) => s.key === status);

  const handleTrack = () => {
    navigate(`/customer/trips/track/${trip._id}`);
  };

  const handleReorder = () => {
    // Placeholder for future reorder logic
    // e.g. navigate(`/customer/create-order?fromTrip=${trip._id}`);
    alert("Reorder flow will be implemented later.");
  };

  const formatMoney = (v) =>
    typeof v === "number" ? v.toFixed(2) : "0.00";

  return (
    <>
      <div className={styles.overlay} onClick={onClose}></div>

      <div className={styles.drawer}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h2>Order #{String(trip._id).slice(-6)}</h2>
            <p className={styles.subtitle}>
              {isActive && "Your order is on the way."}
              {isDelivered && "This order has been delivered."}
              {isCancelled && "This order was cancelled."}
            </p>
          </div>

          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        {/* STATUS TIMELINE */}
        <div className={styles.timeline}>
          {timelineSteps.map((step, index) => (
            <div
              key={step.key}
              className={`${styles.timelineStep} ${
                index <= currentStepIndex ? styles.active : ""
              }`}
            >
              <div className={styles.circle}></div>
              <p>{step.label}</p>
            </div>
          ))}
        </div>

        {/* CANCEL BANNER (if cancelled) */}
        {isCancelled && (
          <div className={styles.cancelBox}>
            <h4>Order Cancelled</h4>
            <p>
              {trip.cancelReason
                ? trip.cancelReason
                : "No cancellation reason was recorded."}
            </p>
          </div>
        )}

        {/* DRIVER INFO */}
        {trip.driverId ? (
          <div className={styles.driverCard}>
            <img
              src={
                trip.driverId.profileImage
                  ? `${import.meta.env.VITE_API_URL}${trip.driverId.profileImage}`
                  : "/default-avatar.png"
              }
              alt="driver"
            />
            <div>
              <h3 className={styles.driverName}>{trip.driverId.name}</h3>
              <p className={styles.driverMeta}>
                Phone: {trip.driverId.phone || "N/A"}
              </p>
            </div>

            {trip.vehicleId && (
              <div className={styles.vehicleBox}>
                <p>{trip.vehicleId.type || "Vehicle"}</p>
                <p>{trip.vehicleId.plateNumber || "N/A"}</p>
              </div>
            )}
          </div>
        ) : (
          !isDelivered &&
          !isCancelled && (
            <p className={styles.waitingDriver}>Waiting for driver...</p>
          )
        )}

        {/* ADDRESSES */}
        <div className={styles.locationBox}>
          <h4>Pickup</h4>
          <p>{trip.pickupLocation?.address}</p>

          <h4>Dropoff</h4>
          <p>{trip.dropoffLocation?.address}</p>
        </div>

        {/* PAYMENT / TOTAL */}
        <div className={styles.paymentBox}>
          <div className={styles.paymentRow}>
            <span>Delivery Fee</span>
            <strong>${formatMoney(trip.deliveryFee)}</strong>
          </div>

          <div className={styles.paymentRow}>
            <span>Total Amount</span>
            <strong>${formatMoney(trip.totalAmount || 0)}</strong>
          </div>

          {trip.paymentStatus && (
            <div className={styles.paymentStatusRow}>
              <span>Payment Status:</span>
              <span className={styles.paymentStatusBadge}>
                {trip.paymentStatus.charAt(0).toUpperCase() +
                  trip.paymentStatus.slice(1)}
              </span>
            </div>
          )}
        </div>

        {/* QR & BARCODE (ACTIVE + DELIVERED) */}
        {(isActive || isDelivered) && (
          <>
            <div className={styles.qrSection}>
              <h4>Order QR Code</h4>
              <QRCode
                value={JSON.stringify({
                  tripId: trip._id,
                  driver: trip.driverId?.name,
                  vehicle: trip.vehicleId?.plateNumber,
                  fee: trip.deliveryFee,
                })}
                size={140}
              />
            </div>

            <div className={styles.barcodeBox}>
              <h4>Delivery Barcode</h4>
              <Barcode
                value={String(trip._id)}
                format="CODE128"
                width={1.8}
                height={50}
              />
            </div>
          </>
        )}

        {/* ACTIONS */}
        <div className={styles.actions}>
          {isActive && (
            <button className={styles.primaryTrackBtn} onClick={handleTrack}>
              Track Live
            </button>
          )}

          {isDelivered && (
            <button className={styles.primaryTrackBtn} onClick={handleReorder}>
              Reorder this delivery
            </button>
          )}

          <button className={styles.closeDrawerBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerTripDrawer;
