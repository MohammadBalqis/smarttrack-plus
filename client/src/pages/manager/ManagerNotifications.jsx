import React, { useEffect, useState } from "react";
import {
  getManagerNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
} from "../../api/managerNotificationsApi";

import styles from "../../styles/manager/managerNotifications.module.css";

const ManagerNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all"); // all | unread
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await getManagerNotificationsApi();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await markNotificationAsReadApi(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  const typeColor = (type) => {
    switch (type) {
      case "trip":
        return styles.badgeTrip;
      case "order":
        return styles.badgeOrder;
      case "driver":
        return styles.badgeDriver;
      case "vehicle":
        return styles.badgeVehicle;
      default:
        return styles.badgeDefault;
    }
  };

  return (
    <div className={styles.page}>
      <h1>Notifications</h1>
      <p className={styles.subtitle}>Stay updated with your company activity.</p>

      {/* Header buttons */}
      <div className={styles.headerRow}>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="unread">Unread</option>
        </select>

        <button className={styles.readAllBtn} onClick={markAllAsRead}>
          Mark All as Read
        </button>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>No notifications found.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map((n) => (
            <div
              key={n._id}
              className={`${styles.item} ${!n.isRead ? styles.unread : ""}`}
            >
              <div className={styles.left}>
                <span className={`${styles.badge} ${typeColor(n.type)}`}>
                  {n.type}
                </span>

                <div>
                  <p className={styles.message}>{n.message}</p>
                  <p className={styles.time}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <button
                  className={styles.readBtn}
                  onClick={() => markAsRead(n._id)}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerNotifications;
