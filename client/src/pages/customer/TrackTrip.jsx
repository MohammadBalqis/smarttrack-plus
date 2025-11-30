// client/src/pages/customer/TrackTrip.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";
import { QRCodeSVG } from "qrcode.react";

import {
  getCustomerTripDetailsApi,
  markTripReceivedApi,
} from "../../api/customerTripsApi";
import socket from "../../socket";

import styles from "../../styles/customer/customerTrackTrip.module.css";

const mapContainerStyle = { width: "100%", height: "100%" };

const CustomerTrackTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [driverPosition, setDriverPosition] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  // Google Maps API key (support Vite + CRA)
  const googleMapsApiKey =
    import.meta?.env?.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey,
  });

  // Auto map theme: light in day, dark at night
  const isNight = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  }, []);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: false,
      styles: isNight
        ? [
            { elementType: "geometry", stylers: [{ color: "#1f2933" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#f9fafb" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#374151" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#111827" }] },
          ]
        : [
            { elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#111827" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
          ],
    }),
    [isNight]
  );

  /* ==========================
     Load trip details
  ========================== */
  const loadTrip = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCustomerTripDetailsApi(tripId);
      if (!res.data?.ok || !res.data.trip) {
        setError("Trip not found.");
        return;
      }

      const t = res.data.trip;
      setTrip(t);

      // Initial driver position
      let initialDriverPos = null;
      if (Array.isArray(t.routeHistory) && t.routeHistory.length > 0) {
        const last = t.routeHistory[t.routeHistory.length - 1];
        initialDriverPos = { lat: last.lat, lng: last.lng };
        setRoutePoints(
          t.routeHistory.map((p) => ({ lat: p.lat, lng: p.lng }))
        );
      } else if (t.pickupLocation?.lat && t.pickupLocation?.lng) {
        initialDriverPos = {
          lat: t.pickupLocation.lat,
          lng: t.pickupLocation.lng,
        };
      }
      setDriverPosition(initialDriverPos);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Failed to load trip details. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) loadTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  /* ==========================
     Socket.io live tracking
  ========================== */
  useEffect(() => {
    if (!tripId) return;

    // Join trip room
    socket.emit("join_trip", { tripId });

    const handleLocationUpdate = (payload) => {
      if (payload.tripId !== tripId) return;
      if (payload.lat && payload.lng) {
        const point = { lat: payload.lat, lng: payload.lng };
        setDriverPosition(point);
        setRoutePoints((prev) => [...prev, point]);
      }
    };

    const handleStatusUpdate = (payload) => {
      if (payload.tripId !== tripId) return;
      setTrip((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status || prev.status,
              liveStatus: payload.liveStatus || prev.liveStatus,
            }
          : prev
      );
    };

    socket.on("trip:location_update", handleLocationUpdate);
    socket.on("trip:status_update", handleStatusUpdate);

    return () => {
      socket.emit("leave_trip", { tripId });
      socket.off("trip:location_update", handleLocationUpdate);
      socket.off("trip:status_update", handleStatusUpdate);
    };
  }, [tripId]);

  /* ==========================
     Helpers
  ========================== */
  const getCenter = () => {
    if (!trip) return { lat: 33.8938, lng: 35.5018 }; // Beirut fallback

    const { pickupLocation, dropoffLocation } = trip;
    if (pickupLocation?.lat && pickupLocation?.lng) {
      return { lat: pickupLocation.lat, lng: pickupLocation.lng };
    }
    if (dropoffLocation?.lat && dropoffLocation?.lng) {
      return { lat: dropoffLocation.lat, lng: dropoffLocation.lng };
    }
    return { lat: 33.8938, lng: 35.5018 };
  };

  const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const canConfirmDelivered =
    trip &&
    trip.status === "delivered" &&
    !trip.customerConfirmed &&
    trip.paymentStatus === "paid";

  const handleConfirmReceived = async () => {
    if (!tripId || !canConfirmDelivered) return;
    try {
      setConfirming(true);
      setSuccessMsg("");
      setError("");

      const res = await markTripReceivedApi(tripId);
      if (res.data?.ok) {
        setTrip((prev) =>
          prev
            ? {
                ...prev,
                customerConfirmed: true,
                confirmationTime: new Date().toISOString(),
              }
            : prev
        );
        setSuccessMsg("Thank you! Order marked as received.");
      } else {
        setError(
          res.data?.error || "Could not confirm delivery. Please try again."
        );
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "Could not confirm delivery. Please try again.";
      setError(msg);
    } finally {
      setConfirming(false);
    }
  };

  const buildQrPayload = () => {
    if (!trip) return "";
    const driver = trip.driverId || {};
    const vehicle = trip.vehicleId || {};
    return JSON.stringify({
      system: "SmartTrack+",
      tripId: trip._id,
      totalAmount: trip.totalAmount,
      deliveryFee: trip.deliveryFee,
      driverName: driver.name,
      driverPhone: driver.phone,
      vehicleType: vehicle.type,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      plateNumber: vehicle.plateNumber,
    });
  };

  /* ==========================
     Render
  ========================== */

  if (loadError) {
    return <div className={styles.page}>Error loading map library.</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate("/customer/trips")}
        >
          ← Back to my orders
        </button>

        <div className={styles.headerTitleBlock}>
          <h1>Track your delivery</h1>
          {trip && (
            <span className={styles.tripId}>
              Trip #{String(trip._id).slice(-6)}
            </span>
          )}
        </div>

        <div className={styles.brandName}>SmartTrack+</div>
      </div>

      <div className={styles.layout}>
        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          {loading && <p className={styles.infoText}>Loading trip...</p>}
          {error && <p className={styles.errorText}>{error}</p>}
          {successMsg && (
            <p className={styles.successText}>{successMsg}</p>
          )}

          {trip && (
            <>
              {/* Status */}
              <section className={styles.section}>
                <div className={styles.statusRow}>
                  <span className={styles.statusPill}>{trip.status}</span>
                  <span className={styles.liveStatus}>
                    {trip.liveStatus || "Waiting for update"}
                  </span>
                </div>
                <p className={styles.muted}>
                  Created at {formatDateTime(trip.createdAt)}
                </p>
              </section>

              {/* Driver & vehicle */}
              <section className={styles.section}>
                <h2>Driver</h2>
                <div className={styles.driverCard}>
                  <div className={styles.driverAvatar}>
                    {trip.driverId?.profileImage ? (
                      <img
                        src={trip.driverId.profileImage}
                        alt={trip.driverId.name}
                      />
                    ) : (
                      <span>
                        {(trip.driverId?.name || "D")[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className={styles.driverInfo}>
                    <p className={styles.driverName}>
                      {trip.driverId?.name || "Not assigned yet"}
                    </p>
                    {trip.driverId?.phone && (
                      <p className={styles.muted}>
                        📞 {trip.driverId.phone}
                      </p>
                    )}
                    {trip.vehicleId && (
                      <p className={styles.muted}>
                        {trip.vehicleId.brand || ""}{" "}
                        {trip.vehicleId.model || ""} —{" "}
                        {trip.vehicleId.plateNumber || ""}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Locations */}
              <section className={styles.section}>
                <h2>Route</h2>
                <div className={styles.routeRow}>
                  <div>
                    <span className={styles.label}>Pickup</span>
                    <p className={styles.value}>
                      {trip.pickupLocation?.address}
                    </p>
                  </div>
                  <div>
                    <span className={styles.label}>Dropoff</span>
                    <p className={styles.value}>
                      {trip.dropoffLocation?.address}
                    </p>
                  </div>
                </div>
              </section>

              {/* Prices */}
              <section className={styles.section}>
                <h2>Payment</h2>
                <div className={styles.paymentRow}>
                  <div>
                    <span className={styles.label}>Delivery fee</span>
                    <p className={styles.value}>
                      {trip.deliveryFee?.toFixed(2)} $
                    </p>
                  </div>
                  <div>
                    <span className={styles.label}>Total amount</span>
                    <p className={styles.totalBig}>
                      {trip.totalAmount?.toFixed(2)} $
                    </p>
                  </div>
                </div>
                <p className={styles.muted}>
                  Payment status:{" "}
                  <strong>{trip.paymentStatus || "unpaid"}</strong>
                </p>
              </section>

              {/* QR + Confirm */}
              <section className={styles.section}>
                <h2>Order QR</h2>
                <p className={styles.muted}>
                  Show this QR code to the driver / company if they need to
                  confirm your delivery.
                </p>
                <div className={styles.qrWrapper}>
                  <QRCodeSVG value={buildQrPayload()} size={140} />
                </div>

                <button
                  type="button"
                  disabled={!canConfirmDelivered || confirming}
                  onClick={handleConfirmReceived}
                  className={
                    canConfirmDelivered
                      ? styles.confirmBtn
                      : styles.confirmBtnDisabled
                  }
                >
                  {trip.customerConfirmed
                    ? "Order already confirmed"
                    : confirming
                    ? "Confirming..."
                    : "Mark as received"}
                </button>
                {trip.customerConfirmed && trip.confirmationTime && (
                  <p className={styles.muted}>
                    Confirmed at {formatDateTime(trip.confirmationTime)}
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        {/* MAP AREA */}
        <div className={styles.mapPanel}>
          {!isLoaded ? (
            <div className={styles.mapLoading}>Loading map...</div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={14}
              center={getCenter()}
              options={mapOptions}
            >
              {/* Pickup marker */}
              {trip?.pickupLocation?.lat && trip.pickupLocation.lng && (
                <Marker
                  position={{
                    lat: trip.pickupLocation.lat,
                    lng: trip.pickupLocation.lng,
                  }}
                  label="P"
                />
              )}

              {/* Dropoff marker */}
              {trip?.dropoffLocation?.lat && trip.dropoffLocation.lng && (
                <Marker
                  position={{
                    lat: trip.dropoffLocation.lat,
                    lng: trip.dropoffLocation.lng,
                  }}
                  label="D"
                />
              )}

              {/* Driver marker */}
              {driverPosition && (
                <Marker position={driverPosition} label="🚗" />
              )}

              {/* Route line */}
              {routePoints.length > 1 && (
                <Polyline
                  path={routePoints}
                  options={{
                    strokeColor: "#3b82f6",
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTrackTrip;
