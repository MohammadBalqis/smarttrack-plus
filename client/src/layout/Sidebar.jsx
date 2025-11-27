import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useBranding } from "../../context/BrandingContext";
import SidebarItem from "./SidebarItem";

import styles from "../../styles/layout/sidebar.module.css";

const Sidebar = ({ menu }) => {
  const { branding } = useBranding();
  const [collapsed, setCollapsed] = useState(false);

  const primary = branding?.primaryColor || "#1e40af"; // fallback blue  
  const gradientStart = "#0A1A3C";
  const gradientEnd = "#112B5A";

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      style={{
        background: `linear-gradient(180deg, ${gradientStart}, ${gradientEnd})`,
      }}
    >
      {/* LOGO SECTION */}
      <div className={styles.logoSection}>
        <img
          src={branding?.logoUrl || "/default-logo.png"}
          alt="company logo"
          className={styles.logo}
        />
        {!collapsed && (
          <span className={styles.logoName}>
            {branding?.companyDisplayName || "Company"}
          </span>
        )}
      </div>

      {/* MENU ITEMS */}
      <div className={styles.menu}>
        {menu.map((item, index) => (
          <SidebarItem
            key={index}
            to={item.to}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            primary={primary}
          />
        ))}
      </div>

      {/* COLLAPSE BUTTON */}
      <button
        className={styles.collapseBtn}
        style={{ background: primary }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? "►" : "◄"}
      </button>
    </aside>
  );
};

export default Sidebar;
