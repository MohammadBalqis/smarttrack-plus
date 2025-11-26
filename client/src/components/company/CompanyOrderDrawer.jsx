import React, { useEffect, useState } from "react";
import { getSingleCompanyOrderApi } from "../../api/companyOrdersApi";
import styles from "../../styles/company/companyOrders.module.css";

const CompanyOrderDrawer = ({ open, onClose, order, updateStatus }) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    if (open && order?._id) {
      loadOrder(order._id);
    }
  }, [open, order]);

  const loadOrder = async (id) => {
    const res = await getSingleCompanyOrderApi(id);
    setDetails(res.data.order);
  };

  if (!open || !details) return null;

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2>Order Details</h2>

        <p>
          <strong>Customer:</strong> {details.customerId?.name}
        </p>
        <p>
          <strong>Total:</strong> ${details.total?.toFixed(2)}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className={styles[`badge_${details.status}`]}>
            {details.status}
          </span>
        </p>

        <h3>Items</h3>
        <ul>
          {details.items?.map((i) => (
            <li key={i.productId}>
              {i.name} — {i.quantity} × ${i.price}
            </li>
          ))}
        </ul>

        <h3>Timeline</h3>
        <ul>
          {details.timeline.map((t, index) => (
            <li key={index}>
              <strong>{t.status}</strong> —{" "}
              {new Date(t.timestamp).toLocaleString()}
            </li>
          ))}
        </ul>

        {/* Only company owner can update status */}
        {updateStatus && (
          <div className={styles.statusActions}>
            <button onClick={() => updateStatus(details._id, "accepted")}>
              Accept
            </button>
            <button onClick={() => updateStatus(details._id, "preparing")}>
              Preparing
            </button>
            <button onClick={() => updateStatus(details._id, "assigned")}>
              Assign Driver
            </button>
            <button onClick={() => updateStatus(details._id, "delivering")}>
              Delivering
            </button>
            <button onClick={() => updateStatus(details._id, "delivered")}>
              Delivered
            </button>
            <button onClick={() => updateStatus(details._id, "cancelled")}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyOrderDrawer;
