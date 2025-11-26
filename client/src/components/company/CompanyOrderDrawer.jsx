import React, { useState } from "react";
import {
  updateCompanyOrderStatusApi,
} from "../../api/companyOrdersApi";

import styles from "../../styles/company/companyOrderDrawer.module.css";

const CompanyOrderDrawer = ({ open, onClose, order, reload }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  if (!open || !order) return null;

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      setError("");

      await updateCompanyOrderStatusApi(order._id, newStatus);

      if (reload) reload();
      onClose();

    } catch (err) {
      console.error("Status update error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to update order status. Try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  // Allowed transitions (company)
  const canAccept = order.status === "pending";
  const canPrepare = order.status === "accepted";
  const canCancel =
    ["pending", "accepted", "preparing"].includes(order.status);

  const timeline = Array.isArray(order.timeline) ? order.timeline : [];

  return (
    <div className={styles.overlay}>
      <div className={styles.drawer}>
        {/* Close */}
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <h2 className={styles.title}>Order Details</h2>

        {error && <p className={styles.error}>{error}</p>}

        {/* ============================
            ORDER BASIC INFO
        ============================== */}
        <div className={styles.section}>
          <h3>Order Info</h3>

          <p><strong>Order ID:</strong> {order._id}</p>
          <p><strong>Status:</strong> {order.status}</p>
          <p>
            <strong>Created:</strong>{" "}
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString()
              : ""}
          </p>
          <p>
            <strong>Total:</strong> ${order.total?.toFixed(2) || "0.00"}
          </p>
        </div>

        {/* ============================
            CUSTOMER INFO
        ============================== */}
        <div className={styles.section}>
          <h3>Customer</h3>
          <p><strong>Name:</strong> {order.customerId?.name || "—"}</p>
          <p><strong>Email:</strong> {order.customerId?.email || "—"}</p>
          <p><strong>Phone:</strong> {order.customerId?.phone || "—"}</p>
        </div>

        {/* ============================
            DRIVER INFO
        ============================== */}
        <div className={styles.section}>
          <h3>Driver</h3>
          <p><strong>Name:</strong> {order.driverId?.name || "—"}</p>
          <p><strong>Phone:</strong> {order.driverId?.phone || "—"}</p>
        </div>

        {/* ============================
            VEHICLE INFO
        ============================== */}
        <div className={styles.section}>
          <h3>Vehicle</h3>
          <p><strong>Plate:</strong> {order.vehicleId?.plateNumber || "—"}</p>
          <p><strong>Model:</strong> {order.vehicleId?.model || "—"}</p>
          <p><strong>Brand:</strong> {order.vehicleId?.brand || "—"}</p>
        </div>

        {/* ============================
            QR CODE (placeholder)
        ============================== */}
        <div className={styles.section}>
          <h3>QR Code</h3>
          <div className={styles.qrPlaceholder}>
            QR CODE WILL BE ADDED LATER
          </div>
        </div>

        {/* ============================
            TIMELINE
        ============================== */}
        <div className={styles.section}>
          <h3>Timeline</h3>

          {timeline.length === 0 ? (
            <p className={styles.muted}>No timeline yet.</p>
          ) : (
            <ul className={styles.timelineList}>
              {timeline.map((step, idx) => (
                <li key={idx} className={styles.timelineItem}>
                  <span className={styles.timelineStatus}>{step.status}</span>
                  <span className={styles.timelineTime}>
                    {new Date(step.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ============================
            STATUS UPDATE (COMPANY)
        ============================== */}
        <div className={styles.section}>
          <h3>Update Status</h3>

          <div className={styles.actions}>
            <button
              disabled={!canAccept || updating}
              onClick={() => handleStatusUpdate("accepted")}
              className={styles.primaryBtn}
            >
              Accept
            </button>

            <button
              disabled={!canPrepare || updating}
              onClick={() => handleStatusUpdate("preparing")}
              className={styles.primaryBtn}
            >
              Preparing
            </button>

            <button
              disabled={!canCancel || updating}
              onClick={() => handleStatusUpdate("cancelled")}
              className={styles.dangerBtn}
            >
              Cancel
            </button>
          </div>

          {updating && <p className={styles.smallInfo}>Updating...</p>}
        </div>
      </div>
    </div>
  );
};

export default CompanyOrderDrawer;
