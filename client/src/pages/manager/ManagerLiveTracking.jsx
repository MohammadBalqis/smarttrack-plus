// client/src/pages/manager/ManagerLiveTracking.jsx
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";

import {
  getManagerLiveDriversApi,
  getManagerLiveTripsApi,
} from "../../api/managerLiveApi";

import styles from "../../styles/manager/managerLiveTracking.module.css";
import "leaflet/dist/leaflet.css";

/* ==========================
   FIX LEAFLET ICON PATH
========================== */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ==========================
   HELPERS
========================== */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getRunningTime = (startTime) => {
  if (!startTime) return "—";
  const diff = Date.now() - new Date(startTime).getTime();
  const mins = Math.floor(diff / 60000);
  return `${mins} min`;
};

const ManagerLiveTracking = () => {
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  /* ==========================
     LOAD LIVE DATA
  ========================== */
  const loadLiveData = async () => {
    try {
      setRefreshing(true);
      const [driversRes, tripsRes] = await Promise.all([
        getManagerLiveDriversApi(),
        getManagerLiveTripsApi(),
      ]);

      setDrivers(driversRes.data?.drivers || []);
      setTrips(tripsRes.data?.trips || []);
    } catch (err) {
      console.error("Live tracking error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveData();
    const i = setInterval(loadLiveData, 10000);
    return () => clearInterval(i);
  }, []);

  /* ==========================
     MATCH DRIVER → TRIP
  ========================== */
  const getTripForDriver = (driverId) =>
    trips.find((t) => t.driverId?._id === driverId);

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1>Live Tracking</h1>
          <p>Drivers, customers, and active routes in real time</p>
        </div>

        <button
          className={styles.refreshBtn}
          onClick={loadLiveData}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* MAP */}
      <div className={styles.mapContainer}>
        <MapContainer
          center={[33.8938, 35.5018]} // Beirut
          zoom={11}
          className={styles.map}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* DRIVERS */}
          {drivers.map((d) => {
            if (!d.currentLat || !d.currentLng) return null;

            const trip = getTripForDriver(d._id);
            const customer = trip?.dropoffLocation;

            let distance = null;
            if (customer?.lat && customer?.lng) {
              distance = haversineDistance(
                d.currentLat,
                d.currentLng,
                customer.lat,
                customer.lng
              ).toFixed(2);
            }

            return (
              <React.Fragment key={d._id}>
                {/* DRIVER MARKER */}
                <Marker position={[d.currentLat, d.currentLng]}>
                  <Popup>
                    <strong>{d.name}</strong>
                    <br />
                    Status: {d.driverStatus}
                    <br />
                    Distance: {distance ? `${distance} km` : "—"}
                    <br />
                    Time: {getRunningTime(trip?.startTime)}
                  </Popup>
                </Marker>

                {/* CUSTOMER MARKER */}
                {customer?.lat && customer?.lng && (
                  <Marker position={[customer.lat, customer.lng]}>
                    <Popup>
                      <strong>Customer</strong>
                      <br />
                      {customer.address}
                    </Popup>
                  </Marker>
                )}

                {/* ROUTE LINE */}
                {customer?.lat && customer?.lng && (
                  <Polyline
                    positions={[
                      [d.currentLat, d.currentLng],
                      [customer.lat, customer.lng],
                    ]}
                    pathOptions={{ color: "blue" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default ManagerLiveTracking;
