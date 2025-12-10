import React, { useEffect, useState } from "react";
import {
  getDriverNotificationsApi,
  markDriverNotificationReadApi
} from "../../api/driverApi";

import socket from "../../socket";

import styles from "../../styles/driver/driverNotificationsPanel.module.css";

const DriverNotificationsPanel = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /* =========================================
     Load notifications
  ========================================= */
  const loadNotifications = async () => {
    try {
      setLoading(true);

      const res = await getDriverNotificationsApi();

      const list =
        res.data?.notifications ||
        res.data?.data ||
        res.data ||
        [];

      setNotifications(list);
      setUnreadCount(list.filter(n => !n.isRead).length);

    } catch (err) {
      console.error("Failed to load driver notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  /* =========================================
     Socket Real-Time Notifications
  ========================================= */
  useEffect(() => {
    if (!socket) return;

    const handler = (payload) => {
      setNotifications((prev) => [payload, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    // BACKEND EVENT NAME (UNIFIED)
    socket.on("driver:new_notification", handler);

    return () => {
      socket.off("driver:new_notification", handler);
    };
  }, []);

  /* =========================================
     Mark all as read
  ========================================= */
  const handleMarkAllRead = async () => {
    try {
      await markDriverNotificationReadApi();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const formatTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    return d.toLocaleString();
  };

  return (
    <div className={styles.wrapper}>
      
      {/* 🔔 Bell Icon */}
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.bellIcon}>🔔</span>

        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.panel}>
          
          <div className={styles.panelHeader}>
            <span>Notifications</span>

            <button
              type="button"
              className={styles.refreshBtn}
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻"}
            </button>
          </div>

          <div className={styles.panelSubheader}>
            <button
              type="button"
              className={styles.markReadBtn}
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <p className={styles.emptyText}>No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`${styles.item} ${
                    n.isRead ? styles.itemRead : styles.itemUnread
                  }`}
                >
                  <div className={styles.itemMain}>
                    <p className={styles.itemTitle}>
                      {n.type || "Notification"}
                    </p>
                    {n.message && (
                      <p className={styles.itemMessage}>{n.message}</p>
                    )}
                  </div>

                  <span className={styles.itemTime}>
                    {formatTime(n.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default DriverNotificationsPanel;
