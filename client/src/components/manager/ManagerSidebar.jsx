import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BrandingContext } from "../../context/BrandingContext";
import { useAuth } from "../../context/AuthContext";

import styles from "../../styles/manager/managerSidebar.module.css";

const ManagerSidebar = () => {
  const { branding } = useContext(BrandingContext);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const primary = branding?.primaryColor || "#1F2937";

  const linkClass = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.activeLink}` : styles.link;

  const handleLogout = async () => {
    await logout();          // clears token + session
    navigate("/login");      // redirect safely
  };

  return (
    <div className={styles.sidebar}>
      {/* ================= BRANDING HEADER ================= */}
      <div className={styles.branding} style={{ background: primary }}>
        <h2 className={styles.companyName}>
          {branding?.companyDisplayName || "Your Company"}
        </h2>
        <p className={styles.tagline}>
          {branding?.shortTagline || "Manager Panel"}
        </p>
      </div>

      {/* ================= NAVIGATION ================= */}
      <nav className={styles.nav}>
        <NavLink to="/manager" className={linkClass} end>
          Dashboard
        </NavLink>

        <NavLink to="/manager/drivers" className={linkClass}>
          Drivers
        </NavLink>

        <NavLink to="/manager/customers" className={linkClass}>
          Customers
        </NavLink>

        <NavLink to="/manager/orders" className={linkClass}>
          Orders
        </NavLink>

        <NavLink to="/manager/trips" className={linkClass}>
          Trips
        </NavLink>

        <NavLink to="/manager/live-tracking" className={linkClass}>
          🛰 Live Tracking
        </NavLink>

        <NavLink to="/manager/payments" className={linkClass}>
          Payments
        </NavLink>

        <NavLink to="/manager/products" className={linkClass}>
          Products
        </NavLink>

        <NavLink to="/manager/vehicles" className={linkClass}>
          Vehicles
        </NavLink>

        <NavLink to="/manager/chat" className={linkClass}>
          💬 Chat with Company
        </NavLink>

        <NavLink to="/manager/profile" className={linkClass}>
          👤 Profile
        </NavLink>

        <NavLink to="/manager/settings" className={linkClass}>
          ⚙️ Settings
        </NavLink>
      </nav>

      {/* ================= LOGOUT ================= */}
      <div className={styles.logoutWrapper}>
        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default ManagerSidebar;
