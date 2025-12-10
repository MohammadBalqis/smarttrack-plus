import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";

import socket from "../../socket";
import {
  getDriverActiveTripApi,
  updateDriverTripStatusApi,
} from "../../api/driverApi";

import styles from "../../styles/driver/driverLiveTrip.module.css";

const mapContainerStyle = { width: "100%", height: "100%" };

const DriverLiveTrip = () => {
  const navigate = useNavigate();

  /* ==========================================================
     STATE
  ========================================================== */
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [routePoints, setRoutePoints] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);

  const [sharingLocation, setSharingLocation] = useState(false);
  const [geoWatchId, setGeoWatchId] = useState(null);

  /* NEW — Step 5 */
  const [autoCenter, setAutoCenter] = useState(true);
  const lastLocationSent = useRef(0);
  const mapRef = useRef(null);

  /* ==========================================================
     GOOGLE MAPS API
  ========================================================== */
  const googleMapsApiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useLoadScript({ googleMapsApiKey });

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
      gestureHandling: "greedy",
      styles: isNight
        ? [
            { elementType: "geometry", stylers: [{ color: "#020617" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#e5e7eb" }] },
            { featureType: "road", stylers: [{ color: "#1f2937" }] },
          ]
        : [
            { elementType: "geometry", stylers: [{ color: "#f3f4f6" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#111827" }] },
            { featureType: "water", stylers: [{ color: "#dbeafe" }] },
          ],
    }),
    [isNight]
  );

  /* ==========================================================
     LOAD ACTIVE TRIP
  ========================================================== */
  const loadActiveTrip = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getDriverActiveTripApi();
      const t = res.data?.trip || null;

      setTrip(t);

      if (!t) {
        setRoutePoints([]);
        setCurrentPos(null);
        return;
      }

      // Load existing history
      if (t.routeHistory?.length > 0) {
        const pts = t.routeHistory.map((p) => ({
          lat: p.lat,
          lng: p.lng,
        }));
        setRoutePoints(pts);
        setCurrentPos(pts[pts.length - 1]);
      }

      // Fallback to pickup
      else if (t.pickupLocation?.lat && t.pickupLocation.lng) {
        const p = {
          lat: t.pickupLocation.lat,
          lng: t.pickupLocation.lng,
        };
        setRoutePoints([p]);
        setCurrentPos(p);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load active trip.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveTrip();
  }, []);

  /* ==========================================================
     SOCKET — STATUS CHANGES
  ========================================================== */
  useEffect(() => {
    if (!trip) return;

    const handleStatus = (payload) => {
      if (String(payload.tripId) !== String(trip._id)) return;

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

    socket.on("trip:driver_status_changed:self", handleStatus);
    socket.on("trip:status_update", handleStatus);

    return () => {
      socket.off("trip:driver_status_changed:self", handleStatus);
      socket.off("trip:status_update", handleStatus);
    };
  }, [trip]);

  /* ==========================================================
     SOCKET — JOIN TRIP ROOM
  ========================================================== */
  useEffect(() => {
    if (!trip?._id) return;

    socket.emit("join_trip", { tripId: trip._id });

    return () => {
      socket.emit("leave_trip", { tripId: trip?._id });
    };
  }, [trip?._id]);

  /* ==========================================================
     STEP 5 — GEOLOCATION (Smoothed + throttled + autocenter)
  ========================================================== */
  const startSharingLocation = () => {
    if (!trip?._id) return;

    if (!navigator.geolocation) {
      setError("GPS not supported on this device.");
      return;
    }

    setSharingLocation(true);
    setInfo("Live location enabled.");

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();

        // Throttle to 1 update every 2 seconds
        if (now - lastLocationSent.current < 2000) return;
        lastLocationSent.current = now;

        const point = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        // Update UI
        setCurrentPos(point);
        setRoutePoints((prev) => [...prev, point]);

        // Auto-follow
        if (autoCenter && mapRef.current) {
          mapRef.current.panTo(point);
        }

        // Emit to backend sockets
        socket.emit("driver_location_update", {
          tripId: trip._id,
          lat: point.lat,
          lng: point.lng,
        });
      },
      (err) => {
        console.error(err);
        setError("Unable to get GPS location.");
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    setGeoWatchId(id);
  };

  const stopSharingLocation = () => {
    if (geoWatchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchId);
    }
    setGeoWatchId(null);
    setSharingLocation(false);
    setInfo("Live location stopped.");
  };

  /* ==========================================================
     STATUS CONTROLS
  ========================================================== */
  const canGoInProgress =
    trip && (trip.status === "assigned" || trip.status === "pending");
  const canMarkDelivered = trip && trip.status === "in_progress";
  const canCancel =
    trip &&
    ["pending", "assigned", "in_progress"].includes(trip.status);

  const updateStatus = async (status, liveStatus) => {
    if (!trip?._id) return;

    try {
      setUpdating(true);
      const res = await updateDriverTripStatusApi(trip._id, {
        status,
        liveStatus,
      });

      if (res.data?.trip) {
        setTrip(res.data.trip);
        setInfo("Status updated.");
      }
    } catch (err) {
      console.error(err);
      setError("Could not update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTrip = () =>
    updateStatus("in_progress", "Driver heading to customer");

  const handleCancelTrip = () =>
    updateStatus("cancelled", "Trip cancelled by driver");

  const handleGoScanQr = () => navigate("/driver/scan-qr");

  /* ==========================================================
     MAP CENTER LOGIC
  ========================================================== */
  const getCenter = () => currentPos || { lat: 33.8938, lng: 35.5018 };

  /* ==========================================================
     FORMATTER
  ========================================================== */
  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return d.toLocaleString();
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  if (loadError)
    return <div className={styles.page}>Error loading Google Maps.</div>;

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.headerBar}>
        <div>
          <h1 className={styles.title}>Live Trip Control</h1>
          <p className={styles.subtitle}>
            Real-time route, status control & QR confirmation.
          </p>
        </div>

        <button
          className={styles.backBtn}
          onClick={() => navigate("/driver")}
        >
          ← Back
        </button>
      </div>

      {loading && <p className={styles.infoText}>Loading trip…</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {info && <p className={styles.successText}>{info}</p>}

      {!loading && !trip && (
        <div className={styles.emptyCard}>
          <h2>No Active Trip</h2>
          <p className={styles.muted}>You currently have no active trips.</p>
        </div>
      )}

      {trip && (
        <div className={styles.layout}>
          {/* LEFT PANEL */}
          <div className={styles.leftPanel}>
            {/* Trip Info */}
            <section className={styles.section}>
              <div className={styles.chipRow}>
                <span className={styles.tripChip}>
                  #{String(trip._id).slice(-6)}
                </span>
                <span
                  className={`${styles.statusPill} ${styles[`status_${trip.status}`]}`}
                >
                  {trip.status}
                </span>
              </div>
              <p className={styles.muted}>
                Live Status: <strong>{trip.liveStatus}</strong>
              </p>
              <p className={styles.muted}>
                Created: {formatDateTime(trip.createdAt)}
              </p>
            </section>

            {/* Customer */}
            <section className={styles.section}>
              <h2>Customer</h2>
              <div className={styles.card}>
                <p>Name: {trip.customerId?.name || "—"}</p>
                <p>Phone: {trip.customerId?.phone || trip.customerPhone}</p>
              </div>
            </section>

            {/* Route */}
            <section className={styles.section}>
              <h2>Route</h2>
              <div className={styles.card}>
                <p>Pickup: {trip.pickupLocation?.address}</p>
                <p>Dropoff: {trip.dropoffLocation?.address}</p>
              </div>
            </section>

            {/* Payment */}
            <section className={styles.section}>
              <h2>Payment</h2>
              <div className={styles.card}>
                <p>Fee: {trip.deliveryFee?.toFixed(2)}$</p>
                <p>Total: {trip.totalAmount?.toFixed(2)}$</p>
                <p>Status: {trip.paymentStatus}</p>
              </div>
            </section>

            {/* Controls */}
            <section className={styles.section}>
              <h2>Controls</h2>

              <div className={styles.actionsRow}>
                <button
                  className={styles.primaryBtn}
                  disabled={!canGoInProgress || updating}
                  onClick={handleStartTrip}
                >
                  {trip.status === "in_progress"
                    ? "Trip In Progress"
                    : "Start Trip"}
                </button>

                <button
                  className={styles.secondaryBtn}
                  disabled={!canMarkDelivered}
                  onClick={handleGoScanQr}
                >
                  Scan QR
                </button>
              </div>

              <div className={styles.actionsRow}>
                <button
                  className={
                    sharingLocation
                      ? styles.secondaryBtn
                      : styles.outlineBtn
                  }
                  onClick={
                    sharingLocation
                      ? stopSharingLocation
                      : startSharingLocation
                  }
                >
                  {sharingLocation ? "Stop Location" : "Share Location"}
                </button>

                <button
                  className={styles.outlineBtn}
                  onClick={() => setAutoCenter(!autoCenter)}
                >
                  {autoCenter ? "Disable Auto-Center" : "Enable Auto-Center"}
                </button>

                <button
                  className={styles.dangerBtn}
                  disabled={!canCancel}
                  onClick={handleCancelTrip}
                >
                  Cancel Trip
                </button>
              </div>
            </section>
          </div>

          {/* MAP PANEL */}
          <div className={styles.mapPanel}>
            {!isLoaded ? (
              <div className={styles.mapLoading}>Loading map…</div>
            ) : (
              <GoogleMap
                onLoad={(map) => (mapRef.current = map)}
                mapContainerStyle={mapContainerStyle}
                zoom={15}
                center={getCenter()}
                options={mapOptions}
              >
                {/* Pickup */}
                {trip.pickupLocation?.lat &&
                  trip.pickupLocation.lng && (
                    <Marker
                      position={{
                        lat: trip.pickupLocation.lat,
                        lng: trip.pickupLocation.lng,
                      }}
                      label="P"
                    />
                  )}

                {/* Dropoff */}
                {trip.dropoffLocation?.lat &&
                  trip.dropoffLocation.lng && (
                    <Marker
                      position={{
                        lat: trip.dropoffLocation.lat,
                        lng: trip.dropoffLocation.lng,
                      }}
                      label="D"
                    />
                  )}

                {/* Driver */}
                {currentPos && <Marker position={currentPos} label="🚚" />}

                {/* Smoothed Route */}
                {routePoints.length > 1 && (
                  <Polyline
                    path={routePoints}
                    options={{
                      strokeColor: "#38bdf8",
                      strokeOpacity: 0.9,
                      strokeWeight: 5,
                    }}
                  />
                )}
              </GoogleMap>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLiveTrip;
