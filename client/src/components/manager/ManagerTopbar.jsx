// client/src/components/manager/ManagerTopbar.jsx
import React from "react";
import styles from "../../styles/manager/managerTopbar.module.css";

const ManagerTopbar = () => {
  return (
    <header className={styles.topbar}>
      <h3 className={styles.title}>Manager Dashboard</h3>

      <div className={styles.right}>
        <span className={styles.roleBadge}>Manager</span>
      </div>
    </header>
  );
};

export default ManagerTopbar;
