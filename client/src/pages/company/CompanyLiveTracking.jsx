import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  getManagerLiveDriversApi,
  getManagerLiveTripsApi,
} from "../../api/managerLiveApi";
import { getCompanyShopsApi } from "../../api/companyShopsApi";

import { branchIcon, driverIcon } from "../../utils/leafletIcons";
import styles from "../../styles/company/companyLiveTracking.module.css";

const CompanyLiveTracking = () => {
  const mapRef = useRef(null);

  const [tab, setTab] = useState("drivers");
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [branches, setBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [focusPoint, setFocusPoint] = useState(null);

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [dRes, tRes, sRes] = await Promise.all([
        getManagerLiveDriversApi(
          statusFilter ? { status: statusFilter } : {}
        ),
        getManagerLiveTripsApi(),
        getCompanyShopsApi(),
      ]);

      setDrivers(dRes.data?.drivers || []);
      setTrips(tRes.data?.trips || []);
      setBranches(
        (sRes.data?.shops || []).filter(
          (s) => s.location?.lat && s.location?.lng
        )
      );
    } catch {
      setError("Failed to load live data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const i = setInterval(loadData, 10000);
    return () => clearInterval(i);
  }, [statusFilter]);

  /* ================= AUTO FIT MAP ================= */
  useEffect(() => {
    if (!mapRef.current) return;

    const points = [];

    drivers.forEach((d) => d.lat && d.lng && points.push([d.lat, d.lng]));
    branches.forEach((b) =>
      points.push([b.location.lat, b.location.lng])
    );
    trips.forEach((t) => {
      t.driver?.lat && points.push([t.driver.lat, t.driver.lng]);
      t.pickup?.lat && points.push([t.pickup.lat, t.pickup.lng]);
      t.dropoff?.lat && points.push([t.dropoff.lat, t.dropoff.lng]);
    });

    if (points.length > 0) {
      mapRef.current.fitBounds(points, { padding: [60, 60] });
    }
  }, [drivers, trips, branches]);

  /* ================= MAP CENTER ================= */
  const center = focusPoint || [33.8938, 35.5018];

  /* ================= RENDER ================= */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Live Tracking</h1>
        {loading && <span>Updating…</span>}
      </div>

      <div className={styles.layout}>
        {/* ================= LEFT PANEL ================= */}
        <div className={styles.left}>
          <div className={styles.tabs}>
            {["drivers", "trips", "branches"].map((t) => (
              <button
                key={t}
                className={tab === t ? styles.activeTab : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "drivers" && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="in_progress">In Progress</option>
                <option value="offline">Offline</option>
              </select>

              {drivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setFocusPoint([d.lat, d.lng])}
                  className={styles.listItem}
                >
                  {d.name} ({d.status})
                </button>
              ))}
            </>
          )}

          {tab === "trips" &&
            trips.map((t) => (
              <button
                key={t.id}
                onClick={() =>
                  t.driver?.lat &&
                  setFocusPoint([t.driver.lat, t.driver.lng])
                }
                className={styles.listItem}
              >
                Trip #{String(t.id).slice(-6)}
              </button>
            ))}

          {tab === "branches" &&
            branches.map((b) => (
              <button
                key={b._id}
                onClick={() =>
                  setFocusPoint([
                    b.location.lat,
                    b.location.lng,
                  ])
                }
                className={styles.listItem}
              >
                {b.name} – {b.city}
              </button>
            ))}
        </div>

        {/* ================= MAP ================= */}
        <div className={styles.mapWrap}>
          <MapContainer
            center={center}
            zoom={13}
            className={styles.map}
            whenCreated={(map) => (mapRef.current = map)}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {/* ===== BRANCHES ===== */}
            {branches.map((b) => (
              <React.Fragment key={b._id}>
                <Marker
                  position={[
                    b.location.lat,
                    b.location.lng,
                  ]}
                  icon={branchIcon}
                >
                  <Popup>
                    <strong>{b.name}</strong>
                    <p>{b.address}</p>
                  </Popup>
                </Marker>

                {/* Delivery radius */}
                {b.maxDeliveryDistanceKm && (
                  <Circle
                    center={[
                      b.location.lat,
                      b.location.lng,
                    ]}
                    radius={b.maxDeliveryDistanceKm * 1000}
                    pathOptions={{
                      color: "#2563eb",
                      fillOpacity: 0.08,
                    }}
                  />
                )}
              </React.Fragment>
            ))}

            {/* ===== DRIVERS ===== */}
            {drivers.map(
              (d) =>
                d.lat && (
                  <Marker
                    key={d.id}
                    position={[d.lat, d.lng]}
                    icon={driverIcon}
                  >
                    <Popup>
                      <strong>{d.name}</strong>
                      <p>Status: {d.status}</p>
                    </Popup>
                  </Marker>
                )
            )}

            {/* ===== TRIPS ===== */}
            {trips.map(
              (t) =>
                t.pickup?.lat && (
                  <Circle
                    key={t.id}
                    center={[t.pickup.lat, t.pickup.lng]}
                    radius={120}
                    pathOptions={{
                      color: "#f59e0b",
                      fillOpacity: 0.7,
                    }}
                  />
                )
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CompanyLiveTracking;
