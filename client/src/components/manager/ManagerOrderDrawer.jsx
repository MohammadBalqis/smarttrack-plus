// client/src/components/manager/ManagerOrderDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerOrderDetailsApi,
  getManagerOrderTimelineApi,
} from "../../api/managerOrdersApi";
import styles from "../../styles/manager/managerOrders.module.css";

const ManagerOrderDrawer = ({ open, onClose, order }) => {
  const [details, setDetails] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && order?._id) {
      loadDetails(order._id);
      loadTimeline(order._id);
    } else {
      setDetails(null);
      setTimeline([]);
      setError("");
    }
  }, [open, order]);

  const loadDetails = async (orderId) => {
    try {
      setLoading(true);
      setError("");
      const res = await getManagerOrderDetailsApi(orderId);
      if (res.data?.ok) {
        setDetails(res.data.order || null);
      } else {
        setError("Failed to load order details.");
      }
    } catch (err) {
      console.error("Drawer details error:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (orderId) => {
    try {
      setTimelineLoading(true);
      const res = await getManagerOrderTimelineApi(orderId);
      if (res.data?.ok) {
        setTimeline(res.data.timeline || []);
      } else {
        setTimeline([]);
      }
    } catch (err) {
      console.error("Drawer timeline error:", err);
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  };

  if (!open || !order) return null;

  const formatMoney = (value) => {
    if (typeof value !== "number") return "0.00";
    return value.toFixed(2);
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const d = details || order;

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.drawerCloseBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.drawerTitle}>
          Order #{String(order._id).slice(-6)}
        </h2>

        {loading ? (
          <p className={styles.smallInfo}>Loading order details...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <>
            {/* Top info */}
            <div className={styles.drawerTopRow}>
              <div className={styles.drawerStatusBlock}>
                <span className={styles.drawerLabel}>Status</span>
                <span
                  className={
                    styles[`badge_${d.status}`] || styles.badge_default
                  }
                >
                  {d.status}
                </span>
              </div>
              <div className={styles.drawerStatusBlock}>
                <span className={styles.drawerLabel}>Total</span>
                <span className={styles.drawerTotal}>
                  ${formatMoney(d.total || 0)}
                </span>
              </div>
              <div className={styles.drawerStatusBlock}>
                <span className={styles.drawerLabel}>Created</span>
                <span className={styles.drawerValue}>
                  {formatDateTime(d.createdAt)}
                </span>
              </div>
            </div>

            {/* Customer + Delivery */}
            <div className={styles.drawerGrid}>
              {/* Customer */}
              <div className={styles.drawerCard}>
                <h3 className={styles.drawerCardTitle}>Customer</h3>
                <p className={styles.drawerValue}>
                  <strong>{d.customerId?.name || "—"}</strong>
                </p>
                <p className={styles.drawerMuted}>
                  {d.customerId?.email || ""}
                </p>
                <p className={styles.drawerMuted}>
                  {d.customerId?.phone || d.customerPhone || ""}
                </p>
              </div>

              {/* Driver */}
              <div className={styles.drawerCard}>
                <h3 className={styles.drawerCardTitle}>Driver & Vehicle</h3>
                <p className={styles.drawerValue}>
                  <strong>{d.driverId?.name || "Not assigned"}</strong>
                </p>
                <p className={styles.drawerMuted}>
                  {d.vehicleId
                    ? `${d.vehicleId.plateNumber || ""} ${
                        d.vehicleId.brand || ""
                      }`
                    : "No vehicle"}
                </p>
              </div>
            </div>

            {/* Addresses */}
            <div className={styles.drawerCard}>
              <h3 className={styles.drawerCardTitle}>Route</h3>
              <div className={styles.routeRow}>
                <div>
                  <span className={styles.routeLabel}>Pickup</span>
                  <p className={styles.routeAddress}>
                    {d.pickupLocation?.address || "—"}
                  </p>
                </div>
                <span className={styles.routeArrow}>→</span>
                <div>
                  <span className={styles.routeLabel}>Dropoff</span>
                  <p className={styles.routeAddress}>
                    {d.dropoffLocation?.address || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className={styles.drawerCard}>
              <h3 className={styles.drawerCardTitle}>Items</h3>
              {(!d.items || d.items.length === 0) ? (
                <p className={styles.empty}>No items in this order.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.name || "—"}</td>
                          <td>${formatMoney(item.price || 0)}</td>
                          <td>{item.quantity || 0}</td>
                          <td>${formatMoney(item.subtotal || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals */}
              <div className={styles.totalsRow}>
                <div>
                  <span className={styles.drawerLabel}>Subtotal</span>
                  <span className={styles.drawerValue}>
                    ${formatMoney(d.subtotal || 0)}
                  </span>
                </div>
                <div>
                  <span className={styles.drawerLabel}>Delivery Fee</span>
                  <span className={styles.drawerValue}>
                    ${formatMoney(d.deliveryFee || 0)}
                  </span>
                </div>
                <div>
                  <span className={styles.drawerLabel}>Discount</span>
                  <span className={styles.drawerValue}>
                    -${formatMoney(d.discount || 0)}
                  </span>
                </div>
                <div>
                  <span className={styles.drawerLabel}>Tax</span>
                  <span className={styles.drawerValue}>
                    ${formatMoney(d.tax || 0)}
                  </span>
                </div>
                <div>
                  <span className={styles.drawerLabel}>Total</span>
                  <span className={styles.drawerTotal}>
                    ${formatMoney(d.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className={styles.drawerCard}>
              <h3 className={styles.drawerCardTitle}>Timeline</h3>
              {timelineLoading ? (
                <p className={styles.smallInfo}>Loading timeline...</p>
              ) : timeline.length === 0 ? (
                <p className={styles.empty}>No timeline entries.</p>
              ) : (
                <ul className={styles.timelineList}>
                  {timeline.map((t, idx) => (
                    <li key={idx} className={styles.timelineItem}>
                      <span className={styles.timelineStatus}>
                        {t.status}
                      </span>
                      <span className={styles.timelineTime}>
                        {formatDateTime(t.timestamp)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerOrderDrawer;
