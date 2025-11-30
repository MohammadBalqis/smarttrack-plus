// client/src/components/customer/MapPicker.jsx
import React from "react";
import styles from "../../styles/customer/createTrip.module.css";

const MapPicker = ({
  pickupLocation,
  dropoffLocation,
  onUseCurrentLocation,
}) => {
  return (
    <div className={styles.mapCard}>
      <div className={styles.sectionHeader}>
        <div>
          <h3>Map & Live Location</h3>
          <p className={styles.sectionSub}>
            Preview your pickup and dropoff points. Later you can plug real
            Google Maps here.
          </p>
        </div>
        <button
          type="button"
          className={styles.chipButton}
          onClick={onUseCurrentLocation}
        >
          📍 Use my current location
        </button>
      </div>

      <div className={styles.mapBox}>
        {/* Placeholder – later replace with <GoogleMap ...> */}
        <div className={styles.mapPlaceholder}>
          <span>SmartTrack+ Map Preview</span>
          <small>(Google Maps integration coming in security phase)</small>
        </div>

        <div className={styles.mapInfoRow}>
          <div>
            <span className={styles.smallLabel}>Pickup</span>
            <p className={styles.mapInfoValue}>
              {pickupLocation.address || "Not set"}
            </p>
            {pickupLocation.lat && pickupLocation.lng && (
              <p className={styles.mapInfoCoords}>
                {pickupLocation.lat.toFixed(5)},{" "}
                {pickupLocation.lng.toFixed(5)}
              </p>
            )}
          </div>
          <div>
            <span className={styles.smallLabel}>Dropoff</span>
            <p className={styles.mapInfoValue}>
              {dropoffLocation.address || "Not set"}
            </p>
            {dropoffLocation.lat && dropoffLocation.lng && (
              <p className={styles.mapInfoCoords}>
                {dropoffLocation.lat.toFixed(5)},{" "}
                {dropoffLocation.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className={styles.mapHint}>
        💡 Later: clicking on the map can update pickup/dropoff, and driver
        live location will appear here.
      </p>
    </div>
  );
};

export default MapPicker;
