import React, { useEffect, useState } from "react";
import {
  getMySessionsApi,
  logoutSessionApi,
  logoutAllSessionsApi,
} from "../../api/sessionApi";

import styles from "../../styles/customer/sessions.module.css";

const CustomerSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await getMySessionsApi();
      if (res.data.ok) {
        setSessions(res.data.sessions || []);
        setCurrentSessionId(localStorage.getItem("sessionId"));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const logoutSession = async (id) => {
    if (!window.confirm("Logout this device?")) return;

    try {
      await logoutSessionApi(id);
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  const logoutAll = async () => {
    if (!window.confirm("Logout from ALL devices except this one?")) return;

    try {
      await logoutAllSessionsApi();
      loadSessions();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading) {
    return <p className={styles.loading}>Loading your sessions…</p>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Active Sessions</h1>
      <p className={styles.sub}>Manage your login activity & device access.</p>

      <button className={styles.logoutAllBtn} onClick={logoutAll}>
        Logout From All Other Devices
      </button>

      <div className={styles.list}>
        {sessions.map((s) => (
          <div
            key={s._id}
            className={`${styles.card} ${
              s._id === currentSessionId ? styles.current : ""
            }`}
          >
            <div className={styles.row1}>
              <h3 className={styles.deviceName}>{s.device || "Unknown Device"}</h3>
              {s._id === currentSessionId && (
                <span className={styles.badge}>This Device</span>
              )}
            </div>

            <p className={styles.meta}>
              Browser: <strong>{s.browser || "Unknown"}</strong>
            </p>
            <p className={styles.meta}>
              OS: <strong>{s.os || "Unknown"}</strong>
            </p>

            <p className={styles.metaSmall}>
              Logged in: {new Date(s.createdAt).toLocaleString()}
            </p>
            <p className={styles.metaSmall}>
              Last active: {new Date(s.lastActiveAt).toLocaleString()}
            </p>

            {s._id !== currentSessionId && (
              <button
                className={styles.logoutBtn}
                onClick={() => logoutSession(s._id)}
              >
                Logout
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerSessions;
