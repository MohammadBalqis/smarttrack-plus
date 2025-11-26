// client/src/components/company/CompanyPaymentDrawer.jsx
import React from "react";
import styles from "../../styles/company/companyPaymentDrawer.module.css";

const CompanyPaymentDrawer = ({ open, onClose, payment }) => {
  if (!open) return null;

  const p = payment || {};

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />

      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2>Payment Details</h2>

        {/* ============================
            BASIC INFO
        ============================= */}
        <div className={styles.section}>
          <h3>Basic Info</h3>

          <div className={styles.infoRow}>
            <span className={styles.label}>Payment ID:</span>
            <span className={styles.value}>{p._id}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Trip ID:</span>
            <span className={styles.value}>{p.tripId || "—"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Status:</span>
            <span className={styles.value}>{p.status}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Method:</span>
            <span className={styles.value}>{p.method}</span>
          </div>

          {p.paidAt && (
            <div className={styles.infoRow}>
              <span className={styles.label}>Paid At:</span>
              <span className={styles.value}>
                {new Date(p.paidAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* ============================
            USERS
        ============================= */}
        <div className={styles.section}>
          <h3>Users</h3>

          <div className={styles.infoRow}>
            <span className={styles.label}>Customer:</span>
            <span className={styles.value}>{p.customerId?.name || "—"}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Driver:</span>
            <span className={styles.value}>{p.driverId?.name || "—"}</span>
          </div>
        </div>

        {/* ============================
            AMOUNTS
        ============================= */}
        <div className={styles.section}>
          <h3>Amounts</h3>

          <div className={styles.infoRow}>
            <span className={styles.label}>Total Amount:</span>
            <span className={styles.value}>${p.totalAmount?.toFixed(2)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Delivery Fee:</span>
            <span className={styles.value}>${p.deliveryFee?.toFixed(2)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Product Total:</span>
            <span className={styles.value}>${p.productTotal?.toFixed(2)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Discount:</span>
            <span className={styles.value}>-${p.discountAmount?.toFixed(2)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Tax:</span>
            <span className={styles.value}>${p.taxAmount?.toFixed(2)}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Gateway Fee:</span>
            <span className={styles.value}>${p.gatewayFee?.toFixed(2)}</span>
          </div>
        </div>

        {/* ============================
            BREAKDOWN SNAPSHOT
        ============================= */}
        {p.paymentBreakdown && (
          <div className={styles.section}>
            <h3>Payment Breakdown</h3>
            <div className={styles.breakdownBox}>
              {Object.entries(p.paymentBreakdown).map(([k, v]) => (
                <div key={k} className={styles.breakdownRow}>
                  <span>{k}</span>
                  <strong>${Number(v).toFixed(2)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================
            EARNINGS
        ============================= */}
        <div className={styles.section}>
          <h3>Earnings</h3>
          <div className={styles.earningBox}>
            <div className={styles.earningRow}>
              <span>Driver:</span>
              <strong>${p.driverEarning?.toFixed(2)}</strong>
            </div>

            <div className={styles.earningRow}>
              <span>Company:</span>
              <strong>${p.companyEarning?.toFixed(2)}</strong>
            </div>

            <div className={styles.earningRow}>
              <span>Platform:</span>
              <strong>${p.platformEarning?.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* ============================
            INVOICE
        ============================= */}
        <div className={styles.section}>
          <h3>Invoice</h3>

          <div className={styles.infoRow}>
            <span className={styles.label}>Invoice Number:</span>
            <span className={styles.value}>{p.invoiceNumber || "—"}</span>
          </div>

          {p.invoicePdfUrl && (
            <div className={styles.infoRow}>
              <span className={styles.label}>PDF:</span>
              <a href={p.invoicePdfUrl} target="_blank" rel="noreferrer">
                View PDF
              </a>
            </div>
          )}

          <div className={styles.infoRow}>
            <span className={styles.label}>Generated:</span>
            <span className={styles.value}>
              {p.generationDate
                ? new Date(p.generationDate).toLocaleString()
                : "—"}
            </span>
          </div>
        </div>

        {/* ============================
            META / GATEWAY
        ============================= */}
        {p.meta && Object.keys(p.meta).length > 0 && (
          <div className={styles.section}>
            <h3>Metadata</h3>

            <div className={styles.metaBlock}>
              {Object.entries(p.meta).map(([key, val]) => (
                <div key={key} className={styles.metaRow}>
                  <span>{key}</span>
                  <strong>{String(val)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {p.gatewayResponse && Object.keys(p.gatewayResponse).length > 0 && (
          <div className={styles.section}>
            <h3>Gateway Response</h3>
            <div className={styles.metaBlock}>
              <pre>{JSON.stringify(p.gatewayResponse, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CompanyPaymentDrawer;
