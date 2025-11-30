// client/src/layout/ManagerLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import ManagerSidebar from "../components/manager/ManagerSidebar";
import ManagerTopbar from "../components/manager/ManagerTopbar";

import styles from "../styles/manager/managerLayout.module.css";

const ManagerLayout = () => {
  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <ManagerSidebar />
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        <ManagerTopbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;
