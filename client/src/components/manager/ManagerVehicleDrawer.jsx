// src/components/manager/ManagerVehicleDrawer.jsx
import React from "react";
import styles from "../../styles/manager/managerVehicles.module.css";

const ManagerVehicleDrawer = ({ open, onClose, vehicle }) => {
  if (!open || !vehicle) return null;

  const driver = vehicle.driverId;
  const lastTrip = vehicle.lastTripId;

  const renderLastService = () => {
    if (!vehicle.lastServiceDate) return "—";
    return new Date(vehicle.lastServiceDate).toLocaleDateString();
  };

  const renderNextService = () => {
    if (!vehicle.nextServiceDue) return "—";

    const due = new Date(vehicle.nextServiceDue);
    const now = new Date();

    const overdue = due < now;

    return (
      <span
        className={overdue ? styles.dangerText : ""}
      >
        {due.toLocaleDateString()}
        {overdue && " (Overdue)"}
      </span>
    );
  };

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        {/* Close button */}
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        <h2 className={styles.drawerTitle}>Vehicle Details</h2>

        {/* Vehicle Image */}
        <div className={styles.imageContainer}>
          {vehicle.vehicleImage ? (
            <img
              src={vehicle.vehicleImage}
              alt={vehicle.plateNumber}
              className={styles.vehicleImage}
            />
          ) : (
            <div className={styles.noImageLarge}>No Image</div>
          )}
        </div>

        {/* Section: Basic Info */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Basic Info</h3>

          <div className={styles.infoRow}>
            <span>Type:</span>
            <strong>{vehicle.type}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Brand / Model:</span>
            <strong>{vehicle.brand} {vehicle.model}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Plate Number:</span>
            <strong>{vehicle.plateNumber}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Status:</span>
            <span
              className={
                vehicle.status === "available"
                  ? styles.badgeAvailable
                  : vehicle.status === "in_use"
                  ? styles.badgeInUse
                  : styles.badgeMaintenance
              }
            >
              {vehicle.status === "in_use" ? "In Use" : vehicle.status}
            </span>
          </div>
        </div>

        {/* Section: Vehicle Specs */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Specifications</h3>

          <div className={styles.infoRow}>
            <span>Mileage:</span>
            <strong>{vehicle.mileage || 0} km</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Fuel Type:</span>
            <strong>{vehicle.fuelType}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Engine Capacity:</span>
            <strong>{vehicle.engineCapacity || "—"}</strong>
          </div>

          {vehicle.notes && (
            <div className={styles.notesBox}>
              <p>{vehicle.notes}</p>
            </div>
          )}
        </div>

        {/* Section: Maintenance */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Maintenance</h3>

          <div className={styles.infoRow}>
            <span>Last Service:</span>
            <strong>{renderLastService()}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>Next Service Due:</span>
            <strong>{renderNextService()}</strong>
          </div>
        </div>

        {/* Section: Assigned Driver */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Assigned Driver</h3>

          {!driver ? (
            <p className={styles.unassigned}>No driver assigned</p>
          ) : (
            <>
              <div className={styles.driverRow}>
                <span>Name:</span>
                <strong>{driver.name}</strong>
              </div>

              <div className={styles.driverRow}>
                <span>Email:</span>
                <strong>{driver.email}</strong>
              </div>

              <div className={styles.driverRow}>
                <span>Phone:</span>
                <strong>{driver.phoneNumber || "—"}</strong>
              </div>
            </>
          )}
        </div>

        {/* Section: Last Trip */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Last Trip</h3>

          {!lastTrip ? (
            <p className={styles.empty}>No trips yet for this vehicle.</p>
          ) : (
            <>
              <div className={styles.infoRow}>
                <span>Date:</span>
                <strong>{new Date(lastTrip.createdAt).toLocaleString()}</strong>
              </div>

              <div className={styles.routeRow}>
                <span>Route:</span>
                <div className={styles.routeText}>
                  {lastTrip.pickupLocation?.address || "—"}
                  <span className={styles.arrow}>→</span>
                  {lastTrip.dropoffLocation?.address || "—"}
                </div>
              </div>

              <div className={styles.infoRow}>
                <span>Status:</span>
                <span
                  className={
                    styles[`badge_${lastTrip.status}`] ||
                    styles.badge_default
                  }
                >
                  {lastTrip.status}
                </span>
              </div>

              <div className={styles.infoRow}>
                <span>Total:</span>
                <strong>${lastTrip.totalAmount?.toFixed(2) || "0.00"}</strong>
              </div>

              <div className={styles.infoRow}>
                <span>Customer:</span>
                <strong>
                  {lastTrip.customerId?.name || "—"}
                </strong>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManagerVehicleDrawer;
