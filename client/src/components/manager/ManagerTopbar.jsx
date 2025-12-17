// client/src/components/manager/ManagerTopbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

import styles from "../../styles/manager/managerTopbar.module.css";
import NotificationsDropdown from "./NotificationsDropdown";

import {
  getManagerNotificationsApi,
  markManagerNotificationReadApi,
  markAllManagerNotificationsApi,
} from "../../api/notificationsApi";

const ManagerTopbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const socketRef = useRef(null);
  const dropdownRef = useRef(null);

  // ✅ Your system uses st_token; keep fallback just in case
  const token = useMemo(
    () => localStorage.getItem("st_token") || localStorage.getItem("token"),
    []
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  /* ==========================================================
     LOAD NOTIFICATIONS (REST)
  ========================================================== */
  const loadNotifications = async () => {
    if (!token) return; // no auth → skip
    try {
      setLoadingNotifs(true);
      const res = await getManagerNotificationsApi({ limit: 20 });

      const list = res.data?.notifications || [];
      setNotifications(list);
    } catch (err) {
      // Keep this short to avoid noise
      console.error(
        "Error loading notifications:",
        err?.response?.data || err?.message || err
      );
    } finally {
      setLoadingNotifs(false);
    }
  };

  /* ==========================================================
     DROPDOWN TOGGLE + OUTSIDE CLICK CLOSE
  ========================================================== */
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  /* ==========================================================
     SOCKET.IO (REAL TIME)
  ========================================================== */
 useEffect(() => {
  if (!token) return;

  const socket = io(import.meta.env.VITE_API_URL, {
    transports: ["websocket"],
    auth: { token },
  });

  socketRef.current = socket;

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
    socket.disconnect();
  });

  return () => socket.disconnect();
}, [token]);
  /* ==========================================================
     INITIAL LOAD
  ========================================================== */
  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ==========================================================
     ACTIONS
  ========================================================== */
  const handleMarkRead = async (id) => {
    if (!id) return;
    try {
      await markManagerNotificationReadApi(id);
      // ✅ optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, isRead: true, readAt: new Date() } : n
        )
      );
    } catch (err) {
      console.error(
        "Failed to mark notification as read:",
        err?.response?.data || err?.message || err
      );
      // fallback reload
      loadNotifications();
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllManagerNotificationsApi();
      // ✅ optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: new Date() }))
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err?.response?.data || err?.message || err
      );
      loadNotifications();
    }
  };

  /* ==========================================================
     UI
  ========================================================== */
  return (
    <header className={styles.topbar}>
      <h3 className={styles.title}>Manager Dashboard</h3>

      <div className={styles.right} ref={dropdownRef}>
        {/* Notification Bell */}
        <div
          className={styles.bellWrapper}
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && toggleDropdown()}
          title={token ? "Notifications" : "Login required"}
        >
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
            loading={loadingNotifs}
          />
        )}

        <span className={styles.roleBadge}>Manager</span>
      </div>
    </header>
  );
};

export default ManagerTopbar;
