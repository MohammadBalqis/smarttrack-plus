// client/src/components/company/CompanySidebar.jsx
import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { BrandingContext } from "../../context/BrandingContext";

import styles from "../../styles/company/companySidebar.module.css";

const CompanySidebar = () => {
  const { branding } = useContext(BrandingContext);

  const primary = branding?.primaryColor || "#1F2937";

  return (
    <div className={styles.sidebar}>
      {/* BRANDING HEADER */}
      <div className={styles.branding} style={{ background: primary }}>
        <h2 className={styles.companyName}>
          {branding?.companyDisplayName || "Your Company"}
        </h2>
        <p className={styles.tagline}>
          {branding?.shortTagline || "Company Owner Panel"}
        </p>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className={styles.nav}>
        <NavLink
          to="/company"
          end
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/company/products"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Products
        </NavLink>

        <NavLink
          to="/company/drivers"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Drivers
        </NavLink>

        <NavLink
          to="/company/customers"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Customers
        </NavLink>

        <NavLink
          to="/company/orders"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Orders
        </NavLink>

        <NavLink
          to="/company/trips"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Trips
        </NavLink>

        <NavLink
          to="/company/payments"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Payments
        </NavLink>

        <NavLink
          to="/company/vehicles"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Vehicles
        </NavLink>

        {/* 🟢 NEW: LIVE TRACKING */}
        <NavLink
          to="/company/live-tracking"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Live Tracking
        </NavLink>

        <NavLink
          to="/company/profile"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Profile & Branding
        </NavLink>
      </nav>
    </div>
  );
};

export default CompanySidebar;
