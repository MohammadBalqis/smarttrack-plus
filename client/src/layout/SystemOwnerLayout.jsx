// client/src/layout/SystemOwnerLayout.jsx
import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/layouts/ownerLayout.module.css";

const SystemOwnerLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      {/* SIDEBAR */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.logo}>
          SmartTrack+
          <span className={styles.logoSub}>System Owner</span>
        </div>

        <nav className={styles.menu}>
          <NavLink
            to="/owner"
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/owner/companies"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Companies & Subscriptions
          </NavLink>

          <NavLink
            to="/owner/billing"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Billing & Invoices
          </NavLink>

          <NavLink
            to="/owner/settings"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Settings
          </NavLink>

          <button type="button" onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>

          <div className={styles.topbarRight}>
            <span className={styles.userName}>{user?.name || "Owner"}</span>
            <span className={styles.userRole}>System Owner</span>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SystemOwnerLayout;
