// client/src/pages/customer/CustomerTrackTrip.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import {
  getCustomerTripDetailsApi,
} from "../../api/customerTripsApi";

import styles from "../../styles/customer/track.module.css";

const socket = io(import.meta.env.VITE_API_URL, {
  transports: ["websocket"],
});

const CustomerTrackTrip = () => {
  const { tripId } = useParams();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const driverMarker = useRef(null);

  const [trip, setTrip] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [driverLocation, setDriverLocation] = useState(null);

  /* ==========================================================
     LOAD TRIP DETAILS
  ========================================================== */
  const loadTrip = async () => {
    try {
      const res = await getCustomerTripDetailsApi(tripId);
      const t = res.data.trip;
      setTrip(t);
      setStatus(t.status || "pending");
    } catch (err) {
      console.log("Trip load error:", err.message);
    }
  };

  /* ==========================================================
     INITIALIZE GOOGLE MAP
  ========================================================== */
  const initMap = () => {
    if (!trip) return;

    mapInstance.current = new google.maps.Map(mapRef.current, {
      center: {
        lat: trip.dropoffLocation.lat || 33.8938,
        lng: trip.dropoffLocation.lng || 35.5018,
      },
      zoom: 13,
      mapId: "customer_live_map",
    });

    // Pickup marker
    new google.maps.Marker({
      position: {
        lat: trip.pickupLocation.lat,
        lng: trip.pickupLocation.lng,
      },
      map: mapInstance.current,
      title: "Pickup Location",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
      },
    });

    // Dropoff marker
    new google.maps.Marker({
      position: {
        lat: trip.dropoffLocation.lat,
        lng: trip.dropoffLocation.lng,
      },
      map: mapInstance.current,
      title: "Dropoff Location",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
      },
    });
  };

  /* ==========================================================
     DRIVER MARKER UPDATE
  ========================================================== */
  const updateDriverMarker = (lat, lng) => {
    if (!mapInstance.current) return;

    if (!driverMarker.current) {
      driverMarker.current = new google.maps.Marker({
        map: mapInstance.current,
        title: "Driver",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        },
      });
    }

    driverMarker.current.setPosition({ lat, lng });

    // Center map on driver
    mapInstance.current.panTo({ lat, lng });
  };

  /* ==========================================================
     SOCKET.IO LIVE EVENTS
  ========================================================== */
  useEffect(() => {
    if (!tripId) return;

    socket.emit("join_trip", { tripId });

    socket.on("trip:location_update", ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
      updateDriverMarker(lat, lng);
    });

    socket.on("trip:status_update", ({ status }) => {
      setStatus(status);
    });

    return () => {
      socket.emit("leave_trip", { tripId });
      socket.off("trip:location_update");
      socket.off("trip:status_update");
    };
  }, [tripId, trip]);

  /* ==========================================================
     LOAD TRIP THEN LOAD MAP
  ========================================================== */
  useEffect(() => {
    loadTrip();
  }, []);

  useEffect(() => {
    if (trip) initMap();
  }, [trip]);

  if (!trip) return <p className={styles.loading}>Loading trip…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Live Tracking</h1>

      {/* STATUS */}
      <div className={styles.statusBox}>
        <strong>Trip Status:</strong> {status}
      </div>

      {/* DRIVER INFO */}
      {trip.driverId ? (
        <div className={styles.driverCard}>
          <img
            src={
              trip.driverId.profileImage
                ? `${import.meta.env.VITE_API_URL}${trip.driverId.profileImage}`
                : "/default-avatar.png"
            }
            alt="driver"
            className={styles.driverImg}
          />
          <div>
            <h3>{trip.driverId.name}</h3>
            <p>Phone: {trip.driverId.phone || "N/A"}</p>
            {driverLocation && (
              <p className={styles.dot}>● Driver is moving…</p>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.waiting}>Waiting for a driver assignment…</p>
      )}

      {/* MAP */}
      <div className={styles.map} ref={mapRef}></div>
    </div>
  );
};

export default CustomerTrackTrip;
