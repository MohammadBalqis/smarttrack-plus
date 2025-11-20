import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import styles from "../../styles/layout/customerLayout.module.css";

const CustomerLayout = () => {
  return (
    <div className={styles.container}>
      
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>SmartTrack+</h2>

        <nav className={styles.menu}>
          <NavLink
            to="/customer/products"
            className={({ isActive }) =>
              isActive ? styles.activeLink : styles.link
            }
          >
            Products
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        <Outlet /> {/* Customer pages load here */}
      </main>
    </div>
  );
};

export default CustomerLayout;
