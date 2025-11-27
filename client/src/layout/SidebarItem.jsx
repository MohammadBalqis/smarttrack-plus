import React from "react";
import { NavLink } from "react-router-dom";
import styles from "../../styles/layout/sidebar.module.css";

const SidebarItem = ({ to, label, icon, collapsed, primary }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.item} ${isActive ? styles.active : ""}`
      }
      style={({ isActive }) => ({
        borderLeft: isActive ? `4px solid ${primary}` : "4px solid transparent",
      })}
    >
      <div className={styles.iconWrapper} style={{ color: primary }}>
        {icon}
      </div>

      {!collapsed && <span className={styles.label}>{label}</span>}
    </NavLink>
  );
};

export default SidebarItem;
