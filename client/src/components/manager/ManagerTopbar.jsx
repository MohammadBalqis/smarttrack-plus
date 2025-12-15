import React, { useEffect, useState, useRef } from "react";
import styles from "../../styles/manager/managerTopbar.module.css";
import {
  getManagerNotificationsApi,
  markManagerNotificationReadApi,
  markAllManagerNotificationsApi,
} from "../../api/notificationsApi";
import NotificationsDropdown from "./NotificationsDropdown";
import { io } from "socket.io-client";

const ManagerTopbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const socketRef = useRef(null);

  /* ==========================================================
     LOAD NOTIFICATIONS
  ========================================================== */
  const loadNotifications = async () => {
    try {
      const res = await getManagerNotificationsApi({ limit: 20 });
      const list = res.data.notifications || [];

      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  /* ==========================================================
     DROPDOWN TOGGLE
  ========================================================== */
  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  /* ==========================================================
     REAL-TIME SOCKET CONNECTION
  ========================================================== */
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    socketRef.current.on("notification", (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */
  useEffect(() => {
    loadNotifications();
  }, []);

  /* ==========================================================
     ACTIONS
  ========================================================== */
  const handleMarkRead = async (id) => {
    try {
      await markManagerNotificationReadApi(id);
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllManagerNotificationsApi();
      loadNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications:", err);
    }
  };

  /* ==========================================================
     UI
  ========================================================== */
  return (
    <header className={styles.topbar}>
      <h3 className={styles.title}>Manager Dashboard</h3>

      <div className={styles.right}>
        {/* Notification Bell */}
        <div className={styles.bellWrapper} onClick={toggleDropdown}>
          <span className={styles.bellIcon}>🔔</span>

          {unreadCount > 0 && (
            <span className={styles.unreadBadge}>{unreadCount}</span>
          )}
        </div>

        {/* DROPDOWN */}
        {dropdownOpen && (
          <NotificationsDropdown
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAll={handleMarkAll}
          />
        )}

        <span className={styles.roleBadge}>Manager</span>
      </div>
    </header>
  );
};

export default ManagerTopbar;
