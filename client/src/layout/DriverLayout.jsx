// client/src/layout/DriverLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import socket from "../socket";
import { getDriverNotificationsApi } from "../api/driverApi";

import styles from "../styles/layouts/driverLayout.module.css";

const DriverLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ==========================================================
     1) LOAD INITIAL UNREAD COUNT
  ========================================================== */
  const loadUnread = async () => {
    try {
      const res = await getDriverNotificationsApi();
      const notifs = res.data?.notifications || [];
      const unread = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    loadUnread();
  }, []);

  /* ==========================================================
     2) WEBSOCKET — LISTEN FOR NEW NOTIFICATION
  ========================================================== */
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join_driver_room", { driverId: user._id });

    const handleNewNotif = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("driver:notification:new", handleNewNotif);

    return () => {
      socket.off("driver:notification:new", handleNewNotif);
    };
  }, [user?._id]);

  /* ==========================================================
     3) RESET WHEN OPENING NOTIFICATIONS PAGE
  ========================================================== */
  useEffect(() => {
    if (location.pathname === "/driver/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.layout}>
      {/* ========== SIDEBAR ========== */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.logo}>SmartTrack+ Driver</div>

        <nav className={styles.menu}>
          <NavLink to="/driver" className={styles.link}>
            Dashboard
          </NavLink>

          <NavLink to="/driver/trips" className={styles.link}>
            My Trips
          </NavLink>

          <NavLink to="/driver/payments" className={styles.link}>
            Payments
          </NavLink>

          <NavLink to="/driver/payments-summary" className={styles.link}>
            Earnings Summary
          </NavLink>

          <NavLink to="/driver/notifications" className={styles.link}>
            Notifications
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </NavLink>

          <NavLink to="/driver/profile" className={styles.link}>
            Profile
          </NavLink>
            <NavLink to="/driver/settings" className={styles.link}>
  Settings
</NavLink>

          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </nav>
      </aside>

      {/* ========== MAIN ========== */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </button>

          {/* Bell Icon */}
          <div
            className={styles.bellWrapper}
            onClick={() => navigate("/driver/notifications")}
          >
            <span className={styles.bellIcon}>🔔</span>
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>{unreadCount}</span>
            )}
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DriverLayout;
