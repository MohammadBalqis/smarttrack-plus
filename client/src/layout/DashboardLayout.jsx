import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/layout/dashboardLayout.module.css";

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderMenu = () => {
    switch (role) {
      case "admin":
        return (
          <>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/companies"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
            >
              Companies
            </NavLink>
          </>
        );
      case "company":
        return (
          <>
            <NavLink
              to="/company"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/company/products"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
            >
              Products
            </NavLink>
          </>
        );
      case "manager":
        return (
          <>
            <NavLink
              to="/manager"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              end
            >
              Dashboard
            </NavLink>
          </>
        );
      case "customer":
        return (
          <>
            <NavLink
              to="/customer"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/customer/products"
              className={({ isActive }) =>
                isActive ? styles.activeLink : styles.link
              }
            >
              Products
            </NavLink>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>SmartTrack+</div>
        <div className={styles.roleLabel}>{role.toUpperCase()}</div>
        <nav className={styles.menu}>{renderMenu()}</nav>
      </aside>

      {/* Content */}
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
