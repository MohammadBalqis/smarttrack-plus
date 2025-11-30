import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { customerMenu } from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/dashboardLayout.module.css";

const CustomerLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      {/* ================================
          SIDEBAR (CUSTOMER)
      ================================= */}
      <aside className={styles.sidebar} style={{ background: "#0F172A" }}>
        <div className={styles.logoBox}>
          {/* SYSTEM NAME */}
          <div className={styles.appName}>SmartTrack+</div>
          <div className={styles.appTagline}>Global Customer</div>

          {/* PROFILE IMAGE */}
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Customer"
              className={styles.profileImgLarge}
            />
          ) : (
            <div className={styles.defaultLogo}>Customer</div>
          )}

          {/* CUSTOMER NAME */}
          <p className={styles.companyShort}>{user?.name || "Customer"}</p>

          <div className={styles.roleLabel}>CUSTOMER</div>
        </div>

        {/* MENU */}
        <nav className={styles.menu}>
          {customerMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              style={({ isActive }) =>
                isActive ? { background: "#374151" } : undefined
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ================================
          MAIN CONTENT AREA
      ================================= */}
      <div className={styles.main}>
        <header
          className={styles.topbar}
          style={{ borderBottom: "3px solid #0F172A" }}
        >
          {/* LEFT: SYSTEM NAME (visible on all pages) */}
          <div className={styles.topbarBrand}>
            <span className={styles.topbarBrandMain}>SmartTrack+</span>
            <span className={styles.topbarBrandSub}>Customer Portal</span>
          </div>

          {/* RIGHT: USER INFO */}
          <div className={styles.userInfo}>
            {user?.profileImage && (
              <img
                src={user.profileImage}
                alt="profile"
                className={styles.profileImgSmall}
              />
            )}

            <span>{user?.name || "Customer"}</span>

            <span className={styles.roleChip}>{user?.role}</span>

            <button onClick={handleLogout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
