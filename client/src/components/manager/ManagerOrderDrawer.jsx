// client/src/components/manager/ManagerOrderDrawer.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerOrderDetailsApi,
  getManagerOrderTimelineApi,
  getAvailableDriversForOrdersApi,
  assignDriverToOrderApi,
  generateOrderDeliveryQrApi,
} from "../../api/managerOrdersApi";

import QRCode from "react-qr-code";
import styles from "../../styles/manager/managerOrders.module.css";
import { useBranding } from "../../context/BrandingContext";

const TABS = ["overview", "items", "timeline", "trip"];

const ManagerOrderDrawer = ({ open, onClose, order, onUpdated }) => {
  const { branding } = useBranding();
  const primaryColor = branding?.primaryColor || "#2563EB";

  const [activeTab, setActiveTab] = useState("overview");
  const [details, setDetails] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const [drivers, setDrivers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD DATA
  ========================================================== */
  useEffect(() => {
    if (!open || !order?._id) return;

    setActiveTab("overview");
    setError("");
    setQrData(null);
    setQrError("");

    loadDetails(order._id);
    loadTimeline(order._id);

    if (order.status === "pending") {
      loadAvailableDrivers();
    }
  }, [open, order]);

  const loadDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const res = await getManagerOrderDetailsApi(orderId);
      if (res.data?.ok) setDetails(res.data.order);
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
    } finally {
      setLoadingTimeline(false);
    }
  };

  /* ==========================================================
     AVAILABLE DRIVERS
  ========================================================== */
  const loadAvailableDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const res = await getAvailableDriversForOrdersApi();
      if (res.data?.ok) setDrivers(res.data.drivers || []);
    } finally {
      setLoadingDrivers(false);
    }
  };

  /* ==========================================================
     ASSIGN DRIVER
  ========================================================== */
  const handleAssignDriver = async () => {
    if (!selectedDriverId) return;

    try {
      setAssigning(true);
      await assignDriverToOrderApi(order._id, {
        driverId: selectedDriverId,
      });

      onUpdated?.();
      onClose();
    } catch {
      setError("Failed to assign driver.");
    } finally {
      setAssigning(false);
    }
  };

  /* ==========================================================
     GENERATE DELIVERY QR
  ========================================================== */
  const generateQr = async () => {
    try {
      setQrLoading(true);
      setQrError("");

      const res = await generateOrderDeliveryQrApi(order._id);
      if (res.data?.ok) setQrData(res.data);
      else setQrError("Failed to generate QR.");
    } catch {
      setQrError("Failed to generate QR.");
    } finally {
      setQrLoading(false);
    }
  };

  if (!open || !order) return null;
  const d = details || order;

  const formatMoney = (v) => (typeof v === "number" ? v.toFixed(2) : "0.00");
  const formatDateTime = (v) => (v ? new Date(v).toLocaleString() : "—");

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.drawerCloseBtn} onClick={onClose}>✕</button>

        <h2 className={styles.drawerTitle}>
          Order #{String(order._id).slice(-6)}
        </h2>

        {/* TABS */}
        <div className={styles.tabRow}>
          {TABS.map((t) => (
            <button
              key={t}
              className={`${styles.tabBtn} ${activeTab === t ? styles.tabBtnActive : ""}`}
              onClick={() => setActiveTab(t)}
              style={activeTab === t ? { color: primaryColor } : {}}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <div className={styles.drawerContent}>
          {/* ================= OVERVIEW ================= */}
          {activeTab === "overview" && (
            <>
              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.overviewHeader}>
                <div className={styles.infoBox}>
                  <span>Status</span>
                  <span className={styles[`badge_${d.status}`]}>{d.status}</span>
                </div>
                <div className={styles.infoBox}>
                  <span>Total</span>
                  <strong>${formatMoney(d.total)}</strong>
                </div>
                <div className={styles.infoBox}>
                  <span>Created</span>
                  <span>{formatDateTime(d.createdAt)}</span>
                </div>
              </div>

              {/* ASSIGN DRIVER */}
              {d.status === "pending" && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Assign Driver</h3>

                  {loadingDrivers ? (
                    <p className={styles.smallInfo}>Loading drivers...</p>
                  ) : drivers.length === 0 ? (
                    <p className={styles.empty}>No available drivers.</p>
                  ) : (
                    <>
                      <select
                        value={selectedDriverId}
                        onChange={(e) => setSelectedDriverId(e.target.value)}
                      >
                        <option value="">Select driver</option>
                        {drivers.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} — {d.vehicle?.plateNumber || "No vehicle"}
                          </option>
                        ))}
                      </select>

                      <button
                        className={styles.primaryBtn}
                        style={{ background: primaryColor }}
                        disabled={!selectedDriverId || assigning}
                        onClick={handleAssignDriver}
                      >
                        {assigning ? "Assigning..." : "Assign Driver"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* ================= ITEMS ================= */}
          {activeTab === "items" && (
            <pre>{JSON.stringify(d.items, null, 2)}</pre>
          )}

          {/* ================= TIMELINE ================= */}
          {activeTab === "timeline" && (
            <ul className={styles.timelineList}>
              {timeline.map((t, i) => (
                <li key={i}>
                  {t.status} — {formatDateTime(t.timestamp)}
                </li>
              ))}
            </ul>
          )}

          {/* ================= TRIP / QR ================= */}
          {activeTab === "trip" && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Delivery Verification</h3>

              {!d.driverId ? (
                <p className={styles.empty}>Driver not assigned yet.</p>
              ) : (
                <>
                  <button
                    className={styles.primaryBtn}
                    style={{ background: primaryColor }}
                    onClick={generateQr}
                    disabled={qrLoading}
                  >
                    {qrLoading ? "Generating..." : "Generate Delivery QR"}
                  </button>

                  {qrError && <p className={styles.error}>{qrError}</p>}

                  {qrData && (
                    <div className={styles.qrBox}>
                      <QRCode value={qrData.qrPayload} size={180} />
                      <p className={styles.muted}>
                        Expires at: {new Date(qrData.expiresAt).toLocaleString()}
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
