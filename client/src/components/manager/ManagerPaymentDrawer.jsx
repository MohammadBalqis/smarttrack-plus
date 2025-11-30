// client/src/components/manager/ManagerPaymentDrawer.jsx
import React from "react";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerPayments.module.css";

const ManagerPaymentDrawer = ({ open, onClose, payment }) => {
  const { branding } = useBranding();

  if (!open || !payment) return null;

  const formatMoney = (v) => (v ? Number(v).toFixed(2) : "0.00");

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>

        {/* === HEADER === */}
        <div className={styles.drawerHeader}>
          <h2 style={{ color: branding.primaryColor }}>
            Payment #{String(payment._id).slice(-6)}
          </h2>

          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* === TOP TAGS === */}
        <div className={styles.topTags}>
          <span
            className={`${styles.badge} ${
              styles[`badgeStatus_${payment.status}`] || ""
            }`}
          >
            {payment.status}
          </span>

          <span className={styles.methodTag}>
            {payment.method?.toUpperCase() || "—"}
          </span>

          <span className={styles.totalTag}>
            ${formatMoney(payment.totalAmount)}
          </span>
        </div>

        {/* === DATETIME === */}
        <div className={styles.secondaryInfo}>
          Paid: {formatDateTime(payment.paidAt || payment.createdAt)}
        </div>

        {/* =========================================================
            SECTION: CUSTOMER / DRIVER / COMPANY
        ========================================================== */}
        <div className={styles.sectionTitle}>People</div>

        <div className={styles.infoGrid}>
          {/* Customer */}
          <div className={styles.infoCard}>
            <h3>Customer</h3>
            <p className={styles.mainValue}>
              {payment.customerId?.name || "—"}
            </p>
            <p className={styles.muted}>{payment.customerId?.email}</p>
            <p className={styles.muted}>{payment.customerId?.phone}</p>
          </div>

          {/* Driver */}
          <div className={styles.infoCard}>
            <h3>Driver</h3>
            <p className={styles.mainValue}>
              {payment.driverId?.name || "—"}
            </p>
            <p className={styles.muted}>{payment.driverId?.email}</p>
            <p className={styles.muted}>{payment.driverId?.phone}</p>
          </div>

          {/* Company */}
          <div className={styles.infoCard}>
            <h3>Company</h3>
            <p className={styles.mainValue}>
              {payment.companyId?.name || "—"}
            </p>
            <p className={styles.muted}>{payment.companyId?.email}</p>
          </div>
        </div>

        {/* =========================================================
            SECTION: BREAKDOWN
        ========================================================== */}
        <div className={styles.sectionTitle}>Payment Breakdown</div>

        <div className={styles.breakdownCard}>
          <div className={styles.breakdownRow}>
            <span>Delivery Fee</span>
            <strong>${formatMoney(payment.deliveryFee)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Items Total</span>
            <strong>${formatMoney(payment.productTotal)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Discount</span>
            <strong>-${formatMoney(payment.discountAmount)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Tax</span>
            <strong>${formatMoney(payment.taxAmount)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Gateway Fee</span>
            <strong>${formatMoney(payment.gatewayFee)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Currency</span>
            <strong>{payment.currency || "USD"}</strong>
          </div>

          <hr className={styles.divider} />

          <div className={styles.breakdownRow}>
            <span>Company Earning</span>
            <strong>${formatMoney(payment.companyEarning)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Driver Earning</span>
            <strong>${formatMoney(payment.driverEarning)}</strong>
          </div>

          <div className={styles.breakdownRow}>
            <span>Platform Earning</span>
            <strong>${formatMoney(payment.platformEarning)}</strong>
          </div>
        </div>

        {/* =========================================================
            SECTION: TRIP
        ========================================================== */}
        <div className={styles.sectionTitle}>Trip Info</div>

        <div className={styles.infoCard}>
          <p className={styles.mainValue}>
            Trip #{payment.tripId?._id || payment.tripId || "—"}
          </p>
          <p className={styles.muted}>
            Status: {payment.tripId?.status || "—"}
          </p>
        </div>

      </div>
    </div>
  );
};

export default ManagerPaymentDrawer;
