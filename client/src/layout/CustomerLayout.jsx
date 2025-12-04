import React, { useEffect, useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { customerMenu } from "../components/sidebar/customerMenu";
import styles from "../styles/layouts/customerLayout.module.css";
import { io } from "socket.io-client";

const CustomerLayout = () => {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);

  /* ==========================================================
     🔵 SOCKET.IO — REAL-TIME NOTIFICATIONS
  ========================================================== */

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      transports: ["websocket"],
    });

    // Register customer room
    socket.emit("register", user._id);

    // Listen for new notifications
    socket.on("notification:new", (notif) => {
      // Update unread count UI
      setUnreadCount((prev) => prev + 1);

      // Show toast popup
      setToast({
        title: notif.title || "New update",
        message: notif.message,
      });

      // Hide toast after 4 seconds
      setTimeout(() => setToast(null), 4000);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  /* ==========================================================
     🟡 GET UNREAD COUNT ON FIRST LOAD
  ========================================================== */

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/notifications/list?status=unread`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        const data = await res.json();
        if (data.ok) setUnreadCount(data.total || 0);
      } catch (err) {
        console.error("Unread load error", err);
      }
    };

    fetchUnread();
  }, []);

  /* ==========================================================
     UI + LAYOUT
  ========================================================== */

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={styles.shell}>
      {/* ========== SIDEBAR ========== */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <div className={styles.brandBox}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>🚚</div>
            <div>
              <div className={styles.brandTitle}>SmartTrack+</div>
              <div className={styles.brandSubtitle}>Customer</div>
            </div>
          </div>

          <div className={styles.profileBlock}>
            {user?.profileImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.profileImage}`}
                alt="profile"
                className={styles.profileImgLarge}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                {user?.name?.[0] || "?"}
              </div>
            )}

            <div>
              <div className={styles.profileName}>{user?.name}</div>
              <div className={styles.profileEmail}>{user?.email}</div>
              <div className={styles.roleChip}>CUSTOMER</div>
            </div>
          </div>
        </div>

        {/* MENU */}
        <nav className={styles.menu}>
          {customerMenu.map((item) => {
            const isNotifications = item.path.includes("notifications");

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? styles.menuLinkActive : styles.menuLink
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                {item.label}

                {/* 🔴 unread badge */}
                {isNotifications && unreadCount > 0 && (
                  <span className={styles.unreadBadge}>{unreadCount}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.footerAppName}>SmartTrack+</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </aside>

      {/* BACKDROP */}
      {sidebarOpen && (
        <div className={styles.backdrop} onClick={toggleSidebar}></div>
      )}

      {/* ========== MAIN ========== */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.leftTop}>
            <button className={styles.menuToggle} onClick={toggleSidebar}>
              ☰
            </button>

            <div className={styles.topBrandText}>
              <div className={styles.topAppName}>SmartTrack+</div>
              <div className={styles.topAppTagline}>Customer Portal</div>
            </div>
          </div>

          <div className={styles.topUser}>
            {user?.profileImage ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${user.profileImage}`}
                className={styles.profileImgSmall}
                alt="avatar"
              />
            ) : (
              <div className={styles.profilePlaceholder}>U</div>
            )}

            <div className={styles.topUserText}>
              <div className={styles.topUserName}>{user?.name}</div>
              <div className={styles.topUserRole}>CUSTOMER</div>
            </div>

            <button className={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      {/* ========== TOAST NOTIFICATION ========== */}
      {toast && (
        <div className={styles.toast}>
          <strong>{toast.title}</strong>
          <p>{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;
