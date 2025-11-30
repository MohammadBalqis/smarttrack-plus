// client/src/components/manager/ManagerOrderDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerOrderDetailsApi,
  getManagerOrderTimelineApi,
} from "../../api/managerOrdersApi";
import styles from "../../styles/manager/managerOrders.module.css";
import { useBranding } from "../../context/BrandingContext";

const TABS = ["overview", "items", "timeline", "trip"];

const ManagerOrderDrawer = ({ open, onClose, order }) => {
  const { branding } = useBranding();
  const primaryColor = branding?.primaryColor || "#2563EB";

  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && order?._id) {
      setActiveTab("overview");
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
      setLoadingDetails(true);
      const res = await getManagerOrderDetailsApi(orderId);
      if (res.data?.ok) setDetails(res.data.order);
      else setError("Failed to load order details.");
    } catch {
      setError("Failed to load order details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadTimeline = async (orderId) => {
    try {
      setLoadingTimeline(true);
      const res = await getManagerOrderTimelineApi(orderId);
      if (res.data?.ok) setTimeline(res.data.timeline || []);
      else setTimeline([]);
    } catch {
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  };

  if (!open || !order) return null;

  const d = details || order;

  const formatMoney = (v) => (typeof v === "number" ? v.toFixed(2) : "0.00");
  const formatDateTime = (v) => {
    if (!v) return "—";
    const date = new Date(v);
    return isNaN(date) ? "—" : date.toLocaleString();
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* CLOSE BUTTON */}
        <button className={styles.drawerCloseBtn} onClick={onClose}>
          ✕
        </button>

        {/* TITLE */}
        <h2 className={styles.drawerTitle}>
          Order #{String(order._id).slice(-6)}
        </h2>

        {/* TABS */}
        <div className={styles.tabRow}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.tabBtn} ${
                activeTab === t ? styles.tabBtnActive : ""
              }`}
              style={activeTab === t ? { color: primaryColor } : {}}
              onClick={() => setActiveTab(t)}
            >
              {t === "overview"
                ? "Overview"
                : t === "items"
                ? "Items"
                : t === "timeline"
                ? "Timeline"
                : "Trip / Payment"}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className={styles.drawerContent}>
          {/* ====================== OVERVIEW TAB ====================== */}
          {activeTab === "overview" && (
            <>
              {loadingDetails ? (
                <p className={styles.smallInfo}>Loading details...</p>
              ) : (
                <>
                  {/* TOP INFO */}
                  <div className={styles.overviewHeader}>
                    <div className={styles.infoBox}>
                      <span className={styles.label}>Status</span>
                      <span
                        className={
                          styles[`badge_${d.status}`] || styles.badge_default
                        }
                      >
                        {d.status}
                      </span>
                    </div>

                    <div className={styles.infoBox}>
                      <span className={styles.label}>Total</span>
                      <span className={styles.value}>
                        ${formatMoney(d.total)}
                      </span>
                    </div>

                    <div className={styles.infoBox}>
                      <span className={styles.label}>Created</span>
                      <span className={styles.value}>
                        {formatDateTime(d.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Customer / Driver */}
                  <div className={styles.grid2}>
                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Customer</h3>
                      <p className={styles.value}>
                        <strong>{d.customerId?.name || "—"}</strong>
                      </p>
                      <p className={styles.muted}>{d.customerId?.email}</p>
                      <p className={styles.muted}>
                        {d.customerId?.phone || d.customerPhone}
                      </p>
                    </div>

                    <div className={styles.card}>
                      <h3 className={styles.cardTitle}>Driver / Vehicle</h3>
                      <p className={styles.value}>
                        <strong>{d.driverId?.name || "Not assigned"}</strong>
                      </p>
                      <p className={styles.muted}>
                        {d.vehicleId
                          ? `${d.vehicleId.plateNumber || ""} ${
                              d.vehicleId.brand || ""
                            }`
                          : "No vehicle"}
                      </p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Route</h3>
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
                </>
              )}
            </>
          )}

          {/* ====================== ITEMS TAB ====================== */}
          {activeTab === "items" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Items</h3>

              {!d.items || d.items.length === 0 ? (
                <p className={styles.empty}>No items found.</p>
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
                      {d.items.map((i, idx) => (
                        <tr key={idx}>
                          <td>{i.name}</td>
                          <td>${formatMoney(i.price)}</td>
                          <td>{i.quantity}</td>
                          <td>${formatMoney(i.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={styles.totalsRow}>
                <div>
                  <span className={styles.label}>Subtotal</span>
                  <span className={styles.value}>
                    ${formatMoney(d.subtotal)}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Delivery Fee</span>
                  <span className={styles.value}>
                    ${formatMoney(d.deliveryFee)}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Discount</span>
                  <span className={styles.value}>
                    -${formatMoney(d.discount)}
                  </span>
                </div>
                <div>
                  <span className={styles.label}>Tax</span>
                  <span className={styles.value}>${formatMoney(d.tax)}</span>
                </div>
                <div>
                  <span className={styles.label}>Total</span>
                  <span className={styles.totalValue}>
                    ${formatMoney(d.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ====================== TIMELINE TAB ====================== */}
          {activeTab === "timeline" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Timeline</h3>

              {loadingTimeline ? (
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
          )}

          {/* ====================== TRIP / PAYMENT TAB ====================== */}
          {activeTab === "trip" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Trip & Payment</h3>

              {!details?.tripId && !details?.payment ? (
                <p className={styles.empty}>No trip or payment info.</p>
              ) : (
                <>
                  {details?.tripId && (
                    <div className={styles.section}>
                      <h4>Trip</h4>
                      <p><strong>Status:</strong> {details.tripId.status}</p>
                      <p>
                        <strong>Start:</strong>{" "}
                        {formatDateTime(details.tripId.startTime)}
                      </p>
                      <p>
                        <strong>End:</strong>{" "}
                        {formatDateTime(details.tripId.endTime)}
                      </p>
                    </div>
                  )}

                  {details?.payment && (
                    <div className={styles.section}>
                      <h4>Payment</h4>
                      <p>
                        <strong>Status:</strong> {details.payment.paymentStatus}
                      </p>
                      <p>
                        <strong>Amount:</strong> $
                        {formatMoney(details.payment.amount || 0)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerOrderDrawer;
