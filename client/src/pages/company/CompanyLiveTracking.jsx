// client/src/pages/company/CompanyLiveTracking.jsx
import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  getManagerLiveDriversApi,
  getManagerLiveTripsApi,
} from "../../api/managerLiveApi";

import styles from "../../styles/company/companyLiveTracking.module.css";

const CompanyLiveTracking = () => {
  const [tab, setTab] = useState("drivers"); // "drivers" | "trips"
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [statusFilter, setStatusFilter] = useState(""); // all | available | in_progress | offline...
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // for selecting item from list
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);

  /* ==========================================================
     LOAD LIVE DATA
  ========================================================== */
  const loadLiveData = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter) {
        // backend supports comma-separated statuses
        params.status = statusFilter;
      }

      const [driversRes, tripsRes] = await Promise.all([
        getManagerLiveDriversApi(params),
        getManagerLiveTripsApi({}),
      ]);

      setDrivers(driversRes.data?.drivers || []);
      setTrips(tripsRes.data?.trips || []);
    } catch (err) {
      console.error("❌ Live tracking load error:", err);
      setError(
        err?.response?.data?.error || "Failed to load live data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // initial + refresh every 10s
  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 10000); // 10s polling
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  /* ==========================================================
     MAP CENTER
  ========================================================== */
  const mapCenter = useMemo(() => {
    const points = [];

    drivers.forEach((d) => {
      if (typeof d.lat === "number" && typeof d.lng === "number") {
        points.push([d.lat, d.lng]);
      }
    });

    trips.forEach((t) => {
      if (t.driver?.lat && t.driver?.lng) {
        points.push([t.driver.lat, t.driver.lng]);
      }
      if (t.pickup?.lat && t.pickup?.lng) {
        points.push([t.pickup.lat, t.pickup.lng]);
      }
      if (t.dropoff?.lat && t.dropoff?.lng) {
        points.push([t.dropoff.lat, t.dropoff.lng]);
      }
    });

    if (points.length > 0) {
      return points[0];
    }

    // Default center → Beirut
    return [33.8938, 35.5018];
  }, [drivers, trips]);

  /* ==========================================================
     FILTERED DATA
  ========================================================== */
  const filteredDrivers = useMemo(() => {
    if (!statusFilter) return drivers;
    return drivers.filter((d) => d.status === statusFilter);
  }, [drivers, statusFilter]);

  const activeTrips = useMemo(() => trips || [], [trips]);

  /* ==========================================================
     HELPERS
  ========================================================== */
  const formatTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  const formatStatus = (status) => {
    if (!status) return "—";
    if (status === "in_progress") return "In Progress";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const statusColor = (status) => {
    switch (status) {
      case "available":
        return "#10B981";
      case "in_progress":
        return "#F59E0B";
      case "assigned":
        return "#3B82F6";
      case "offline":
        return "#6B7280";
      default:
        return "#4B5563";
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live Tracking</h1>
          <p className={styles.subtitle}>
            Monitor drivers and active trips from all your shops in real-time.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={loadLiveData}
          >
            Refresh now
          </button>
          {loading && (
            <span className={styles.loadingText}>Updating live data…</span>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT LIST + RIGHT MAP */}
      <div className={styles.layout}>
        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                tab === "drivers" ? styles.tabActive : ""
              }`}
              onClick={() => setTab("drivers")}
            >
              Drivers
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                tab === "trips" ? styles.tabActive : ""
              }`}
              onClick={() => setTab("trips")}
            >
              Trips
            </button>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <label className={styles.filterLabel}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setSelectedDriverId(null);
              }}
            >
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="in_progress">In Progress</option>
              <option value="assigned">Assigned</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          {/* LIST */}
          <div className={styles.list}>
            {tab === "drivers" &&
              (filteredDrivers.length === 0 ? (
                <p className={styles.empty}>No live drivers at the moment.</p>
              ) : (
                filteredDrivers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`${styles.listItem} ${
                      selectedDriverId === d.id ? styles.listItemActive : ""
                    }`}
                    onClick={() => {
                      setSelectedDriverId(d.id);
                      setSelectedTripId(null);
                    }}
                  >
                    <div className={styles.listItemTop}>
                      <span className={styles.driverName}>{d.name}</span>
                      <span
                        className={styles.statusDot}
                        style={{ backgroundColor: statusColor(d.status) }}
                      />
                    </div>
                    <div className={styles.listItemMeta}>
                      <span>{d.phone || "No phone"}</span>
                      <span>
                        Trips: <strong>{d.totalTripsCompleted || 0}</strong>
                      </span>
                      {d.shop && (
                        <span className={styles.shopTag}>
                          {d.shop.city} • {d.shop.name}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ))}

            {tab === "trips" &&
              (activeTrips.length === 0 ? (
                <p className={styles.empty}>No active trips right now.</p>
              ) : (
                activeTrips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.listItem} ${
                      selectedTripId === t.id ? styles.listItemActive : ""
                    }`}
                    onClick={() => {
                      setSelectedTripId(t.id);
                      setSelectedDriverId(null);
                    }}
                  >
                    <div className={styles.listItemTop}>
                      <span className={styles.tripId}>
                        Trip #{String(t.id).slice(-6)}
                      </span>
                      <span
                        className={styles.statusPill}
                        style={{ backgroundColor: statusColor(t.status) }}
                      >
                        {formatStatus(t.status)}
                      </span>
                    </div>
                    <div className={styles.listItemMeta}>
                      <span>
                        {t.customer?.name || "Customer"} →{" "}
                        {t.driver?.name || "Driver"}
                      </span>
                      <span className={styles.small}>
                        {t.pickup?.address || "Pickup"} →{" "}
                        {t.dropoff?.address || "Dropoff"}
                      </span>
                      <span className={styles.small}>
                        {formatTime(t.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              ))}
          </div>
        </div>

        {/* RIGHT PANEL — MAP */}
        <div className={styles.mapPanel}>
          <MapContainer
            center={mapCenter}
            zoom={12}
            scrollWheelZoom
            className={styles.map}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Drivers markers */}
            {filteredDrivers.map((d) =>
              typeof d.lat === "number" && typeof d.lng === "number" ? (
                <CircleMarker
                  key={d.id}
                  center={[d.lat, d.lng]}
                  radius={selectedDriverId === d.id ? 10 : 7}
                  pathOptions={{
                    color: statusColor(d.status),
                    fillColor: statusColor(d.status),
                    fillOpacity: 0.8,
                  }}
                >
                  <Popup>
                    <div className={styles.popup}>
                      <strong>{d.name}</strong>
                      <p>Status: {formatStatus(d.status)}</p>
                      {d.phone && <p>Phone: {d.phone}</p>}
                      {d.shop && (
                        <p>
                          Shop: {d.shop.city} • {d.shop.name}
                        </p>
                      )}
                      <p>Trips: {d.totalTripsCompleted || 0}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ) : null
            )}

            {/* Trips markers: pickup + dropoff + driver position */}
            {activeTrips.map((t) => (
              <React.Fragment key={t.id}>
                {/* Pickup */}
                {t.pickup?.lat && t.pickup?.lng && (
                  <CircleMarker
                    center={[t.pickup.lat, t.pickup.lng]}
                    radius={6}
                    pathOptions={{
                      color: "#3B82F6",
                      fillColor: "#3B82F6",
                      fillOpacity: 0.7,
                    }}
                  >
                    <Popup>
                      <div className={styles.popup}>
                        <strong>Pickup</strong>
                        <p>{t.pickup.address || "Pickup location"}</p>
                        <p>Trip #{String(t.id).slice(-6)}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                )}

                {/* Dropoff */}
                {t.dropoff?.lat && t.dropoff?.lng && (
                  <CircleMarker
                    center={[t.dropoff.lat, t.dropoff.lng]}
                    radius={6}
                    pathOptions={{
                      color: "#EF4444",
                      fillColor: "#EF4444",
                      fillOpacity: 0.7,
                    }}
                  >
                    <Popup>
                      <div className={styles.popup}>
                        <strong>Dropoff</strong>
                        <p>{t.dropoff.address || "Dropoff location"}</p>
                        <p>Trip #{String(t.id).slice(-6)}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                )}

                {/* Driver current position for this trip */}
                {t.driver?.lat && t.driver?.lng && (
                  <CircleMarker
                    center={[t.driver.lat, t.driver.lng]}
                    radius={selectedTripId === t.id ? 11 : 8}
                    pathOptions={{
                      color: "#F59E0B",
                      fillColor: "#F59E0B",
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <div className={styles.popup}>
                        <strong>{t.driver.name || "Driver"}</strong>
                        <p>Trip #{String(t.id).slice(-6)}</p>
                        <p>Status: {formatStatus(t.status)}</p>
                        {t.customer?.name && (
                          <p>Customer: {t.customer.name}</p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                )}
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CompanyLiveTracking;
