// client/src/pages/customer/CustomerNotifications.jsx
import React, { useEffect, useState } from "react";
import {
  getCustomerNotificationsApi,
  markNotificationReadApi,
} from "../../api/customerNotificationsApi";
import styles from "../../styles/customer/notifications.module.css";

const CustomerNotifications = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getCustomerNotificationsApi();
      setNotes(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className={styles.info}>Loading notifications…</p>;

  if (notes.length === 0)
    return <p className={styles.info}>No notifications yet.</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>

      <div className={styles.list}>
        {notes.map((n) => (
          <div
            key={n._id}
            className={`${styles.item} ${n.isRead ? styles.read : ""}`}
            onClick={() => markRead(n._id)}
          >
            <div className={styles.header}>
              <h3>{n.title || "Update"}</h3>
              <span className={styles.time}>
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>

            <p className={styles.body}>{n.message}</p>

            {n.link && (
              <a href={n.link} className={styles.link}>
                View →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerNotifications;
