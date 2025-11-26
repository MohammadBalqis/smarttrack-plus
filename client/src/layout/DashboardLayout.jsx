import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Sidebar items
import {
  managerMenu,
  companyMenu,
  driverMenu,
  customerMenu,
} from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/dashboardLayout.module.css";

const DashboardLayout = ({ role }) => {
  const { user, branding, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /** -----------------------------------------
   *  Get Branding for company / manager / driver
   *  ----------------------------------------- */
  const isBrandingUser = ["company", "manager", "driver"].includes(role);

  // Colors
  const primaryColor =
    (isBrandingUser && branding?.primaryColor) || "#0A74DA";

  const secondaryColor =
    (isBrandingUser && branding?.secondaryColor) || "#005BBB";

  // Logo
  const logoUrl =
    isBrandingUser && branding?.logoUrl
      ? branding.logoUrl
      : null;

  const companyShort =
    isBrandingUser && branding?.shortDescription
      ? branding.shortDescription
      : null;

  /** -----------------------------------------
   *  Choose Sidebar Menu
   *  ----------------------------------------- */
  const getMenu = () => {
    switch (role) {
      case "company":
        return companyMenu;
      case "manager":
        return managerMenu;
      case "driver":
        return driverMenu;
      case "customer":
        return customerMenu; // NO COMPANY BRANDING
      default:
        return [];
    }
  };

  const menuItems = getMenu();

  return (
    <div className={styles.container}>
      {/* ------------------------------------------
          SIDEBAR (with branding)
      ------------------------------------------- */}
      <aside
        className={styles.sidebar}
        style={{ background: primaryColor }}
      >
        <div className={styles.logoBox}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Company Logo"
              className={styles.brandLogo}
            />
          ) : (
            <div className={styles.defaultLogo}>SmartTrack+</div>
          )}

          {companyShort && (
            <p className={styles.companyShort}>{companyShort}</p>
          )}

          {/* Role label stays text-only */}
          <div className={styles.roleLabel}>{role.toUpperCase()}</div>
        </div>

        {/* MENU */}
        <nav className={styles.menu}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              style={({ isActive }) =>
                isActive
                  ? { background: secondaryColor }
                  : undefined
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* ------------------------------------------
          MAIN SECTION
      ------------------------------------------- */}
      <div className={styles.main}>
        <header
          className={styles.topbar}
          style={{
            borderBottom: `3px solid ${primaryColor}`,
          }}
        >
          <div className={styles.userInfo}>
            {role === "customer" ? (
              <>
                <img
                  src={user?.profileImage}
                  className={styles.profileImgSmall}
                  alt=""
                />
                <span>{user?.name}</span>
              </>
            ) : (
              <span>{user?.name || "User"}</span>
            )}

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

export default DashboardLayout;
