// client/src/components/manager/ManagerSidebar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { BrandingContext } from "../../context/BrandingContext";

import styles from "../../styles/manager/managerSidebar.module.css";

const ManagerSidebar = () => {
  const { branding } = useContext(BrandingContext);

  const primary = branding?.primaryColor || "#1F2937";
  const accent = branding?.accentColor || "#2563EB";

  return (
    <div className={styles.sidebar}>
      {/* BRANDING HEADER */}
      <div className={styles.branding} style={{ background: primary }}>
        <h2 className={styles.companyName}>
          {branding?.companyDisplayName || "Your Company"}
        </h2>
        <p className={styles.tagline}>{branding?.shortTagline || "Manager Panel"}</p>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className={styles.nav}>
        <NavLink to="/manager/dashboard" className={styles.link}>
          Dashboard
        </NavLink>

        <NavLink to="/manager/drivers" className={styles.link}>
          Drivers
        </NavLink>

        <NavLink to="/manager/customers" className={styles.link}>
          Customers
        </NavLink>

        <NavLink to="/manager/orders" className={styles.link}>
          Orders
        </NavLink>

        <NavLink to="/manager/trips" className={styles.link}>
          Trips
        </NavLink>

        <NavLink to="/manager/payments" className={styles.link}>
          Payments
        </NavLink>

        <NavLink to="/manager/products" className={styles.link}>
          Products
        </NavLink>

        <NavLink to="/manager/vehicles" className={styles.link}>
          Vehicles
        </NavLink>
      </nav>
    </div>
  );
};

export default ManagerSidebar;
