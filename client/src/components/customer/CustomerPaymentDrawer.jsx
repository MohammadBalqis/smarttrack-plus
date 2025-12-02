// client/src/components/customer/CustomerPaymentDrawer.jsx
import React from "react";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";
import styles from "../../styles/customer/paymentDrawer.module.css";

const CustomerPaymentDrawer = ({ open, onClose, payment }) => {
  if (!open || !payment) return null;

  const trip = payment.tripId;
  const company = payment.companyId;

  return (
    <>
      {/* OVERLAY */}
      <div className={styles.overlay} onClick={onClose} />

      {/* DRAWER */}
      <div className={styles.drawer}>
        {/* HEADER */}
        <div className={styles.header}>
          <h2>Payment #{String(payment._id).slice(-6)}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        {/* PAYMENT STATUS */}
        <div className={styles.statusBox}>
          <span>Status:</span>
          <strong className={styles[`status_${payment.status}`]}>
            {payment.status.toUpperCase()}
          </strong>
        </div>

        {/* TRIP SUMMARY */}
        {trip && (
          <div className={styles.section}>
            <h3>Trip Details</h3>

            <p><strong>From:</strong> {trip.pickupLocation?.address}</p>
            <p><strong>To:</strong> {trip.dropoffLocation?.address}</p>

            <p><strong>Trip Status:</strong> {trip.status}</p>
            <p><strong>Delivery Fee:</strong> ${trip.deliveryFee}</p>
            <p><strong>Total Amount:</strong> ${trip.totalAmount || 0}</p>
          </div>
        )}

        {/* COMPANY INFO */}
        {company && (
          <div className={styles.section}>
            <h3>Company</h3>
            <p><strong>Name:</strong> {company.name}</p>
            <p><strong>Email:</strong> {company.email}</p>
            <p><strong>Phone:</strong> {company.phone}</p>
          </div>
        )}

        {/* DRIVER & VEHICLE */}
        {payment.driver && (
          <div className={styles.driverCard}>
            <img
              src={
                payment.driver.profileImage
                  ? `${import.meta.env.VITE_API_URL}${payment.driver.profileImage}`
                  : "/default-avatar.png"
              }
              alt="driver"
            />

            <div>
              <h3>{payment.driver.name}</h3>
              <p>Phone: {payment.driver.phone || "N/A"}</p>
            </div>

            {payment.vehicle && (
              <div className={styles.vehicleBox}>
                <p>{payment.vehicle.type}</p>
                <p>{payment.vehicle.plateNumber}</p>
              </div>
            )}
          </div>
        )}

        {/* PAYMENT INFO */}
        <div className={styles.section}>
          <h3>Payment Info</h3>
          <p><strong>Method:</strong> {payment.method || "Cash"}</p>
          <p><strong>Transaction ID:</strong> {payment.transactionId || "N/A"}</p>
          <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
        </div>

        {/* QR CODE */}
        <div className={styles.qrBox}>
          <h3>Confirmation QR</h3>
          <QRCode
            value={JSON.stringify({
              paymentId: payment._id,
              tripId: trip?._id,
              amount: payment.amount,
              company: company?.name,
            })}
            size={140}
          />
        </div>

        {/* BARCODE */}
        <div className={styles.barcodeBox}>
          <h3>Transaction Barcode</h3>
          <Barcode
            value={String(payment._id)}
            format="CODE128"
            width={2}
            height={60}
          />
        </div>

        {/* BUTTONS */}
        <div className={styles.actions}>
          <button className={styles.closeDrawerBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default CustomerPaymentDrawer;
