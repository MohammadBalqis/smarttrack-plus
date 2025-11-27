import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { driverMenu } from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/dashboardLayout.module.css";

const DriverLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      {/* ================================
          SIDEBAR (NO BRANDING)
      ================================= */}
      <aside className={styles.sidebar} style={{ background: "#1E293B" }}>
        <div className={styles.logoBox}>

          {/* DRIVER PROFILE PICTURE */}
          {user?.profileImage ? (
            <img
              src={user.profileImage}
              alt="Driver"
              className={styles.profileImgLarge}
            />
          ) : (
            <div className={styles.defaultLogo}>Driver</div>
          )}

          {/* DRIVER NAME */}
          <p className={styles.companyShort}>{user?.name || "Driver"}</p>

          <div className={styles.roleLabel}>DRIVER</div>
        </div>

        {/* MENU */}
        <nav className={styles.menu}>
          {driverMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              style={({ isActive }) =>
                isActive ? { background: "#334155" } : undefined
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
          style={{ borderBottom: "3px solid #1E293B" }}
        >
          <div className={styles.userInfo}>
            {user?.profileImage && (
              <img
                src={user.profileImage}
                alt="profile"
                className={styles.profileImgSmall}
              />
            )}

            <span>{user?.name || "Driver"}</span>

            <span className={styles.roleChip}>{user?.role}</span>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Logout
          </button>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
