// client/src/pages/driver/DriverScanQr.jsx
import React, { useState } from "react";
import { QrReader } from "react-qr-reader-es6";

import { confirmDeliveryFromQrApi } from "../../api/driverApi";
import { useNavigate } from "react-router-dom";

import styles from "../../styles/driver/driverScanQR.module.css";

const DriverScanQr = () => {
  const navigate = useNavigate();

  const [qrValue, setQrValue] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);

  /* --------------------------------------------
     Handle QR Scan from Camera
  -------------------------------------------- */
  const handleScan = (value) => {
    if (!value) return;

    // reset UI first
    setInfoMsg("");
    setError("");

    setQrValue(value);

    try {
      const data = JSON.parse(value);
      if (!data.tripId) {
        setParsed(null);
        setError("QR code missing tripId.");
        return;
      }
      setParsed(data);
    } catch (err) {
      setParsed(null);
      setError("Invalid QR format (not valid JSON).");
    }
  };

  /* --------------------------------------------
     Manual Input
  -------------------------------------------- */
  const handleManualChange = (e) => {
    setQrValue(e.target.value);
    setInfoMsg("");
    setError("");

    try {
      const data = JSON.parse(e.target.value);
      setParsed(data);
    } catch {
      setParsed(null);
    }
  };

  /* --------------------------------------------
     Confirm Delivery
  -------------------------------------------- */
  const handleConfirm = async () => {
    if (!qrValue) return;

    setLoading(true);
    setError("");
    setInfoMsg("");

    try {
      const res = await confirmDeliveryFromQrApi(qrValue);

      if (res.data?.ok) {
        setInfoMsg("✅ Delivery confirmed successfully!");

        // Optional: display trip object returned
        setParsed(res.data.trip || parsed);

        // Redirect after 1.5s to Live Trip
        setTimeout(() => {
          navigate("/driver/live-trip");
        }, 1500);
      } else {
        setError(res.data?.error || "Could not confirm delivery.");
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Could not confirm delivery. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Scan Customer QR</h1>
      <p className={styles.subtitle}>
        Scan the customer’s QR code to confirm delivery.
      </p>

      <div className={styles.layout}>
        {/* LEFT – CAMERA */}
        <div className={styles.scannerBox}>
          <h2>Camera Scanner</h2>

          <div className={styles.scanner}>
            <QrReader
              constraints={{ facingMode: "environment" }}
              onResult={(result) => {
                if (result?.text) handleScan(result.text);
              }}
              containerStyle={{ width: "100%", height: "100%" }}
              videoStyle={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <p className={styles.muted}>
            If camera access fails, paste the QR JSON manually.
          </p>
        </div>

        {/* RIGHT – DETAILS */}
        <div className={styles.detailsBox}>
          {error && <p className={styles.errorText}>{error}</p>}
          {infoMsg && <p className={styles.successText}>{infoMsg}</p>}

          <label className={styles.label}>QR JSON Payload</label>
          <textarea
            className={styles.textarea}
            rows={4}
            value={qrValue}
            onChange={handleManualChange}
            placeholder='Paste QR JSON if scanner is blocked'
          />

          {parsed && (
            <div className={styles.card}>
              <p><strong>Trip:</strong> {parsed.tripId || parsed._id || "—"}</p>

              {parsed.driverName && (
                <p><strong>Driver:</strong> {parsed.driverName}</p>
              )}

              {parsed.driverPhone && (
                <p><strong>Phone:</strong> {parsed.driverPhone}</p>
              )}

              {parsed.vehicleBrand && (
                <p>
                  <strong>Vehicle:</strong> {parsed.vehicleBrand}{" "}
                  {parsed.vehicleModel}{" "}
                  {parsed.plateNumber && `(${parsed.plateNumber})`}
                </p>
              )}

              {parsed.totalAmount != null && (
                <p><strong>Total:</strong> {parsed.totalAmount} $</p>
              )}
            </div>
          )}

          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!qrValue || loading}
          >
            {loading ? "Confirming..." : "Confirm Delivery"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverScanQr;
