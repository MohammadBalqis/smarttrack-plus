// client/src/pages/manager/ManagerLiveTracking.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  getManagerLiveDriversApi,
  getManagerLiveTripsApi,
} from "../../api/managerLiveApi";

import styles from "../../styles/manager/managerLiveTracking.module.css";

const ManagerLiveTracking = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* ==========================================================
     Initialize Google Map (runs only once)
  ========================================================== */
  useEffect(() => {
    if (!window.google) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 33.8938, lng: 35.5018 }, // Beirut center
      zoom: 11,
      mapId: "SMARTTRACK_MAP_STYLE",
    });
  }, []);

  /* ==========================================================
     Helper: Clear old markers
  ========================================================== */
  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  /* ==========================================================
     Fetch drivers + trips
  ========================================================== */
  const loadLiveData = async () => {
    try {
      setRefreshing(true);

      const [driversRes, tripsRes] = await Promise.all([
        getManagerLiveDriversApi(),
        getManagerLiveTripsApi(),
      ]);

      setDrivers(driversRes.data?.drivers || []);
      setTrips(tripsRes.data?.trips || []);

      plotMarkers(driversRes.data?.drivers || []);
    } catch (err) {
      console.error("Live tracking fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     Place Driver Markers on Map
  ========================================================== */
  const plotMarkers = (driversList) => {
    if (!mapInstance.current) return;

    clearMarkers();

    driversList.forEach((driver) => {
      if (!driver.currentLat || !driver.currentLng) return;

      const marker = new window.google.maps.Marker({
        position: {
          lat: driver.currentLat,
          lng: driver.currentLng,
        },
        map: mapInstance.current,
        title: driver.name,
        icon: {
          url: "/map/driver-pin.png", // optional custom pin
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      const info = new window.google.maps.InfoWindow({
        content: `
          <div style="font-size:14px">
            <strong>${driver.name}</strong><br/>
            Status: ${driver.driverStatus || "unknown"}<br/>
            Phone: ${driver.phone || ""}
          </div>
        `,
      });

      marker.addListener("click", () => info.open(mapInstance.current, marker));

      markersRef.current.push(marker);
    });
  };

  /* ==========================================================
     Auto-refresh every 10 seconds
  ========================================================== */
  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <div>
          <h1>Live Tracking</h1>
          <p>Track drivers and active trips in real time.</p>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={loadLiveData}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ================= MAP ================= */}
      <div className={styles.mapContainer}>
        <div ref={mapRef} className={styles.map}></div>
      </div>

      {/* ================= REAL-TIME LISTS ================= */}
      <div className={styles.dataSection}>
        {/* Drivers */}
        <div className={styles.card}>
          <h3>Online Drivers ({drivers.length})</h3>
          <ul className={styles.list}>
            {drivers.map((d) => (
              <li key={d._id}>
                <strong>{d.name}</strong> — {d.driverStatus}
                <br />
                {d.currentLat && d.currentLng ? (
                  <span className={styles.onlineDot}>● Live</span>
                ) : (
                  <span className={styles.offlineDot}>● No Signal</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Active Trips */}
        <div className={styles.card}>
          <h3>Active Trips ({trips.length})</h3>
          <ul className={styles.list}>
            {trips.map((t) => (
              <li key={t._id}>
                Trip #{t._id.slice(-6)} — {t.status}
                <br />
                Driver: {t.driver?.name || "—"}
                <br />
                Customer: {t.customer?.name || "—"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ManagerLiveTracking;
