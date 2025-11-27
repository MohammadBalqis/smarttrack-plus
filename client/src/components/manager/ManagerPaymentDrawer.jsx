// client/src/components/manager/ManagerPaymentDrawer.jsx
import React from "react";
import { useBranding } from "../../context/BrandingContext";
import styles from "../../styles/manager/managerPayments.module.css";

const ManagerPaymentDrawer = ({ open, onClose, payment }) => {
  if (!open) return null;

  const { branding } = useBranding();

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0.00";
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  return (
    <div className={styles.drawerOverlay} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className={styles.closeBtn}
          onClick={onClose}
          style={{ color: branding.primaryColor }}
        >
          ×
        </button>

        <h2 className={styles.drawerTitle}>Payment Details</h2>

        {!payment ? (
          <p>No payment data.</p>
        ) : (
          <>
            {/* ===========================
                BASIC INFO
            ============================ */}
            <div className={styles.section}>
              <h3>Basic Info</h3>

              <p>
                <strong>Payment ID:</strong> {payment._id}
              </p>

              <p>
                <strong>Trip ID:</strong>{" "}
                {payment.tripId?._id || payment.tripId || "—"}
              </p>

              <p>
                <strong>Customer:</strong>{" "}
                {payment.customerId?.name || "—"}
              </p>

              <p>
                <strong>Driver:</strong>{" "}
                {payment.driverId?.name || "—"}
              </p>

              <p>
                <strong>Method:</strong>{" "}
                <span className={styles.methodBadge}>
                  {payment.method || "—"}
                </span>
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className={styles.statusBadge}>
                  {payment.status}
                </span>
              </p>
            </div>

            {/* ===========================
                AMOUNTS
            ============================ */}
            <div className={styles.section}>
              <h3>Amount Breakdown</h3>

              <p>
                <strong>Total Amount:</strong>{" "}
                {formatCurrency(payment.totalAmount)}{" "}
                {payment.currency || "USD"}
              </p>

              <p>
                <strong>Delivery Fee:</strong>{" "}
                {formatCurrency(payment.deliveryFee)}
              </p>

              <p>
                <strong>Products Total:</strong>{" "}
                {formatCurrency(payment.productTotal)}
              </p>

              <p>
                <strong>Discount:</strong>{" "}
                {formatCurrency(payment.discountAmount)}
              </p>

              <p>
                <strong>Tax:</strong>{" "}
                {formatCurrency(payment.taxAmount)}
              </p>

              <p>
                <strong>Gateway Fee:</strong>{" "}
                {formatCurrency(payment.gatewayFee)}
              </p>
            </div>

            {/* ===========================
                EARNINGS
            ============================ */}
            <div className={styles.section}>
              <h3>Earnings</h3>

              <p>
                <strong>Driver Earning:</strong>{" "}
                {formatCurrency(payment.driverEarning)}
              </p>

              <p>
                <strong>Company Earning:</strong>{" "}
                {formatCurrency(payment.companyEarning)}
              </p>

              <p>
                <strong>Platform Earning:</strong>{" "}
                {formatCurrency(payment.platformEarning)}
              </p>
            </div>

            {/* ===========================
                INVOICE
            ============================ */}
            <div className={styles.section}>
              <h3>Invoice</h3>

              <p>
                <strong>Invoice Number:</strong>{" "}
                {payment.invoiceNumber || "—"}
              </p>

              <p>
                <strong>Invoice Generated:</strong>{" "}
                {formatDateTime(payment.generationDate)}
              </p>

              {payment.invoicePdfUrl && (
                <p>
                  <a
                    href={payment.invoicePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.link}
                    style={{ color: branding.primaryColor }}
                  >
                    View Invoice PDF
                  </a>
                </p>
              )}
            </div>

            {/* ===========================
                TIMING
            ============================ */}
            <div className={styles.section}>
              <h3>Timing</h3>

              <p>
                <strong>Paid At:</strong>{" "}
                {formatDateTime(payment.paidAt)}
              </p>

              <p>
                <strong>Created:</strong>{" "}
                {formatDateTime(payment.createdAt)}
              </p>

              <p>
                <strong>Updated:</strong>{" "}
                {formatDateTime(payment.updatedAt)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerPaymentDrawer;
