// client/src/layout/CompanyLayout.jsx
import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { companyMenu } from "../components/sidebar/SidebarItems";
import { io } from "socket.io-client";

import styles from "../styles/layouts/dashboardLayout.module.css";

const CompanyLayout = () => {
  const { user, branding, logout } = useAuth();
  const navigate = useNavigate();

  const [supportCount, setSupportCount] = useState(0);

  // Register socket
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL);

    socket.emit("register", {
      userId: user._id,
      role: "company",
    });

    socket.on("support:new", () => {
      setSupportCount((prev) => prev + 1);
    });

    return () => socket.disconnect();
  }, [user]);

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

          <div className={styles.roleLabel}>COMPANY</div>
        </div>

        <nav className={styles.menu}>
          {companyMenu.map((item) => (
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

              {/* Support badge */}
              {item.path === "/company/support" && supportCount > 0 && (
                <span
                  style={{
                    background: "red",
                    color: "white",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    marginLeft: "8px",
                    fontSize: "12px",
                  }}
                >
                  {supportCount}
                </span>
              )}
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

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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

export default CompanyLayout;
