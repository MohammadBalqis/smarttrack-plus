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
     LOAD INITIAL UNREAD NOTIFICATIONS
  ========================================================== */
  const loadUnread = async () => {
    try {
      const res = await getDriverNotificationsApi();
      const list = res.data?.notifications || [];
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Load notifications error:", err);
    }
  };

  useEffect(() => {
    loadUnread();
  }, []);

  /* ==========================================================
     SOCKET — REALTIME NOTIFICATIONS
  ========================================================== */
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join_driver_room", { driverId: user._id });

    const handleNewNotification = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("driver:notification:new", handleNewNotification);

    return () => {
      socket.off("driver:notification:new", handleNewNotification);
    };
  }, [user?._id]);

  /* ==========================================================
     RESET COUNT WHEN OPENING NOTIFICATIONS PAGE
  ========================================================== */
  useEffect(() => {
    if (location.pathname === "/driver/notifications") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  /* ==========================================================
     AUTO-CLOSE SIDEBAR ON ROUTE CHANGE (MOBILE UX)
  ========================================================== */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* ==========================================================
     RENDER
  ========================================================== */
  return (
    <div className={styles.layout}>
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.logo}>SmartTrack+ Driver</div>

        <nav className={styles.menu}>
          <NavLink
            to="/driver"
            end
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/driver/trips"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            My Trips
          </NavLink>

          <NavLink
            to="/driver/payments"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Payments
          </NavLink>

          <NavLink
            to="/driver/payments-summary"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Earnings Summary
          </NavLink>

          <NavLink
            to="/driver/notifications"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Notifications
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/driver/profile"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Profile
          </NavLink>

          <NavLink
            to="/driver/settings"
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ""}`
            }
          >
            Settings
          </NavLink>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div
            className={styles.bellWrapper}
            onClick={() => navigate("/driver/notifications")}
            title="Notifications"
          >
            <span className={styles.bellIcon}>🔔</span>
            {unreadCount > 0 && (
              <span className={styles.bellBadge}>{unreadCount}</span>
            )}
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLayout;
