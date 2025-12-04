// client/src/pages/customer/CustomerSecurity.jsx

import React, { useEffect, useState } from "react";
import {
  getSessionsApi,
  logoutSessionApi,
  logoutOtherSessionsApi,
} from "../../api/customerSessionsApi";

import styles from "../../styles/customer/security.module.css";

const CustomerSecurity = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await getSessionsApi();
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error("Load sessions error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const logoutOne = async (id) => {
    await logoutSessionApi(id);
    loadSessions();
  };

  const logoutOthers = async () => {
    await logoutOtherSessionsApi();
    loadSessions();
  };

  if (loading) return <p className={styles.info}>Loading sessions…</p>;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Security</h1>
      <p className={styles.sub}>Manage your logged-in devices & sessions.</p>

      <button className={styles.logoutAllBtn} onClick={logoutOthers}>
        Logout all other devices
      </button>

      <div className={styles.list}>
        {sessions.map((s) => (
          <div
            key={s._id}
            className={`${styles.item} ${
              !s.isActive || s.isRevoked ? styles.inactive : ""
            }`}
          >
            <div>
              <h3 className={styles.deviceName}>
                {s.deviceType?.toUpperCase() || "Unknown Device"} —{" "}
                {s.browser || "Unknown Browser"}
              </h3>

              <p>IP: {s.ipAddress || "Unknown"}</p>
              <p>OS: {s.os || "Unknown"}</p>

              <p>
                Last activity:{" "}
                {s.lastActivityAt
                  ? new Date(s.lastActivityAt).toLocaleString()
                  : "Unknown"}
              </p>
            </div>

            {s.isActive && !s.isRevoked && (
              <button
                className={styles.logoutBtn}
                onClick={() => logoutOne(s._id)}
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

export default CustomerSecurity;
