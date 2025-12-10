// client/src/components/common/NotificationBell.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from "../../api/notificationsApi";

import styles from "../../styles/common/notificationBell.module.css";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleOpen = () => {
    setOpen((prev) => !prev);
  };

  const close = () => setOpen(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getNotificationsApi({ page, limit });
      const data = res.data;

      setNotifications(data.notifications || []);
      setTotal(data.total || (data.notifications?.length || 0));
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleItemClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await markNotificationReadApi(notif._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notif._id ? { ...n, isRead: true } : n
          )
        );
      }

      if (notif.link) {
        navigate(notif.link);
        setOpen(false);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all notifications:", err);
    }
  };

  const formatTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  const getTitle = (notif) => {
    if (notif.title && notif.title.trim().length > 0) return notif.title;
    return notif.message?.slice(0, 40) || "Notification";
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      {/* Bell button */}
      <button
        type="button"
        className={styles.bellButton}
        onClick={toggleOpen}
        aria-label="Notifications"
      >
        <span className={styles.bellIcon}>
          {/* Simple bell icon */}
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={styles.bellSvg}
          >
            <path d="M12 2a6 6 0 0 0-6 6v3.586l-.707 1.707A1 1 0 0 0 6.243 15h11.514a1 1 0 0 0 .95-1.364L18 11.586V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 5.995.176L15 19z" />
          </svg>
        </span>

        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div>
              <span className={styles.headerTitle}>Notifications</span>
              <span className={styles.headerSubtitle}>
                {total} total · {unreadCount} unread
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleMarkAll}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {loading && (
              <div className={styles.stateText}>Loading…</div>
            )}

            {error && !loading && (
              <div className={styles.stateTextError}>{error}</div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className={styles.stateText}>No notifications yet.</div>
            )}

            {!loading &&
              !error &&
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  type="button"
                  className={`${styles.item} ${
                    !notif.isRead ? styles.itemUnread : ""
                  }`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitleRow}>
                      <span className={styles.itemTitle}>
                        {getTitle(notif)}
                      </span>
                      {notif.type && (
                        <span className={styles.typeTag}>
                          {notif.type}
                        </span>
                      )}
                    </div>
                    <p className={styles.itemMessage}>
                      {notif.message}
                    </p>
                  </div>

                  <div className={styles.itemMeta}>
                    <span className={styles.itemTime}>
                      {formatTime(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <span className={styles.unreadDot} />
                    )}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
