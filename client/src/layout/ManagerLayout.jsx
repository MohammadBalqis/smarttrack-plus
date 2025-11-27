import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { managerMenu } from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/dashboardLayout.module.css";

const ManagerLayout = () => {
  const { user, branding, logout } = useAuth();
  const navigate = useNavigate();

  const primary = branding?.primaryColor || "#0A74DA";
  const secondary = branding?.secondaryColor || "#005BBB";

  const logoUrl = branding?.logoUrl || null;
  const tagline = branding?.shortDescription || null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar} style={{ background: primary }}>
        <div className={styles.logoBox}>
          {logoUrl ? (
            <img src={logoUrl} className={styles.brandLogo} alt="Company Logo" />
          ) : (
            <div className={styles.defaultLogo}>SmartTrack+</div>
          )}

          {tagline && <p className={styles.companyShort}>{tagline}</p>}

          <div className={styles.roleLabel}>MANAGER</div>
        </div>

        <nav className={styles.menu}>
          {managerMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              style={({ isActive }) =>
                isActive ? { background: secondary } : undefined
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <header
          className={styles.topbar}
          style={{ borderBottom: `3px solid ${primary}` }}
        >
          <div className={styles.userInfo}>
            <span>{user?.name}</span>
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

export default ManagerLayout;
