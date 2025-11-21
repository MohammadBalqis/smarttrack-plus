import React from "react";
import styles from "../../styles/company/companyTrips.module.css";

const TripDrawer = ({ open, onClose, trip }) => {
  if (!open) return null;

  return (
    <div className={styles.drawerOverlay}>
      <div className={styles.drawer}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>

        {!trip ? (
          <p>Loading...</p>
        ) : (
          <>
            <h2 className={styles.drawerTitle}>Trip Details</h2>

            <div className={styles.section}>
              <h4>Driver</h4>
              <p>{trip.driverId?.name || "Unassigned"}</p>
            </div>

            <div className={styles.section}>
              <h4>Customer</h4>
              <p>{trip.customerId?.name}</p>
            </div>

            <div className={styles.section}>
              <h4>Pickup</h4>
              <p>{trip.pickupLocation?.address}</p>
            </div>

            <div className={styles.section}>
              <h4>Dropoff</h4>
              <p>{trip.dropoffLocation?.address}</p>
            </div>

            <div className={styles.section}>
              <h4>Items</h4>
              {trip.orderItems?.length === 0 && <p>No items</p>}

              {trip.orderItems?.map((item) => (
                <div key={item._id} className={styles.itemRow}>
                  <span>{item.name}</span>
                  <span>
                    {item.quantity} × ${item.price}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h4>Total Revenue</h4>
              <p className={styles.totalAmount}>
                ${trip.totalAmount?.toFixed(2)}
              </p>
            </div>

            <div className={styles.section}>
              <h4>Status</h4>
              <span className={styles[`badge_${trip.status}`]}>
                {trip.status}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TripDrawer;
