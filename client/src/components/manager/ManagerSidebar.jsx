// client/src/components/manager/ManagerSidebar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { BrandingContext } from "../../context/BrandingContext";

import styles from "../../styles/manager/managerSidebar.module.css";

const ManagerSidebar = () => {
  const { branding } = useContext(BrandingContext);

  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  const linkClass = ({ isActive }) =>
    isActive ? `${styles.link} ${styles.activeLink}` : styles.link;

  return (
    <div className={styles.sidebar}>
      {/* BRANDING HEADER */}
      <div className={styles.branding} style={{ background: primary }}>
        <h2 className={styles.companyName}>
          {branding?.companyDisplayName || "Your Company"}
        </h2>
        <p className={styles.tagline}>
          {branding?.shortTagline || "Manager Panel"}
        </p>
      </div>

      {/* NAVIGATION LINKS */}
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
      </nav>
    </div>
  );
};

export default ManagerSidebar;
