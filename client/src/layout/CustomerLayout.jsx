// client/src/layout/CustomerLayout.jsx
import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { customerMenu } from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/customerLayout.module.css";

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className={styles.shell}>
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className={styles.backdrop}
          onClick={closeSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`${styles.sidebar} ${
          sidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        {/* Brand / Profile */}
        <div className={styles.brandBox}>
          <div className={styles.brandRow}>
            <div className={styles.brandIcon}>🚀</div>
            <div>
              <div className={styles.brandTitle}>SmartTrack+</div>
              <div className={styles.brandSubtitle}>Customer App</div>
            </div>
          </div>

          <div className={styles.profileBlock}>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || "Customer"}
                className={styles.profileImgLarge}
              />
            ) : (
              <div className={styles.profilePlaceholder}>
                {(user?.name || "C")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div>
              <div className={styles.profileName}>
                {user?.name || "Customer"}
              </div>
              <div className={styles.profileEmail}>
                {user?.email || ""}
              </div>
              <span className={styles.roleChip}>CUSTOMER</span>
            </div>
          </div>
        </div>

        {/* MENU */}
        <nav className={styles.menu}>
          {customerMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                isActive ? styles.menuLinkActive : styles.menuLink
              }
            >
              <span className={styles.menuIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className={styles.sidebarFooter}>
          <span className={styles.footerAppName}>SmartTrack+</span>
          <span className={styles.footerVersion}>v1.0</span>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className={styles.main}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <div className={styles.leftTop}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              ☰
            </button>

            <div className={styles.topBrandText}>
              <span className={styles.topAppName}>SmartTrack+</span>
              <span className={styles.topAppTagline}>
                Track your deliveries in real time
              </span>
            </div>
          </div>

          <div className={styles.topUser}>
            {user?.profileImage && (
              <img
                src={user.profileImage}
                alt="profile"
                className={styles.profileImgSmall}
              />
            )}

            <div className={styles.topUserText}>
              <span className={styles.topUserName}>
                {user?.name || "Customer"}
              </span>
              <span className={styles.topUserRole}>
                {user?.role || "customer"}
              </span>
            </div>

            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
