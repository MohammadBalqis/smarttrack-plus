import React from "react";
import styles from "../../styles/manager/notificationsDropdown.module.css";
import { formatDistanceToNow } from "date-fns";

const NotificationsDropdown = ({
  notifications,
  onMarkRead,
  onMarkAll,
}) => {
  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h4>Notifications</h4>
        <button className={styles.markAllBtn} onClick={onMarkAll}>
          Mark all as read
        </button>
      </div>

      <div className={styles.list}>
        {notifications.length === 0 ? (
          <p className={styles.empty}>No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`${styles.item} ${
                !n.isRead ? styles.unread : ""
              }`}
              onClick={() => onMarkRead(n._id)}
            >
              <div className={styles.message}>{n.message}</div>
              <div className={styles.time}>
                {formatDistanceToNow(new Date(n.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
