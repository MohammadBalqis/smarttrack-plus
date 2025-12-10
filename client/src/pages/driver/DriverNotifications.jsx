import React, { useEffect, useState } from "react";
import {
  getDriverNotificationsApi,
  markDriverNotificationReadApi,
} from "../../api/driverApi";

import styles from "../../styles/driver/driverNotifications.module.css";

const DriverNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  /* ==========================================================
     LOAD NOTIFICATIONS
  ========================================================== */
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDriverNotificationsApi();
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* ==========================================================
     MARK ALL AS READ
  ========================================================== */
  const handleMarkAllRead = async () => {
    try {
      await markDriverNotificationReadApi();
      loadNotifications();
    } catch (err) {
      console.error(err);
      setError("Failed to mark notifications as read.");
    }
  };

  const formatDate = (value) => {
    const d = new Date(value);
    return d.toLocaleString();
  };

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>
      <p className={styles.subtitle}>Your latest system & trip updates.</p>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.refreshBtn}
        onClick={() => {
          setRefreshing(true);
          loadNotifications().finally(() => setRefreshing(false));
        }}
      >
        {refreshing ? "Refreshing..." : "↻ Refresh"}
      </button>

      <div className={styles.listContainer}>
        {loading ? (
          <p className={styles.emptyBox}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p className={styles.emptyBox}>No notifications found.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`${styles.notificationItem} ${
                !n.read ? styles.notificationUnread : ""
              }`}
            >
              <div className={styles.notificationLeft}>
                <div className={styles.notificationTitle}>
                  {n.title}
                  {!n.read && (
                    <span className={styles.notificationBadge}>NEW</span>
                  )}
                </div>

                <div className={styles.notificationMessage}>{n.message}</div>
                <div className={styles.notificationDate}>
                  {formatDate(n.createdAt)}
                </div>
              </div>

              <div className={styles.rightArrow}>›</div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
          Mark all as read
        </button>
      )}
    </div>
  );
};

export default DriverNotifications;
