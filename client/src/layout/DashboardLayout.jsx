import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 🎯 Import sidebar menu items
import {
  managerMenu,
  companyMenu,
} from "../components/sidebar/sidebarItems";

import styles from "../styles/layouts/dashboardLayout.module.css";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // 🎯 Get menu items based on role
  const getMenuForRole = () => {
    switch (role) {
      case "manager":
        return managerMenu;
      case "company":
        return companyMenu;
      default:
        return [];
    }
  };

  const menuItems = getMenuForRole();

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SmartTrack+</div>
        <div className={styles.roleLabel}>{role.toUpperCase()}</div>

        <nav className={styles.menu}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.userInfo}>
            <span>{user?.name || "User"}</span>
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
