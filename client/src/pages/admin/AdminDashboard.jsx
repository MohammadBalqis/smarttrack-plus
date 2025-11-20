import React, { useEffect, useState } from "react";
import { getAllCompaniesApi } from "../../api/adminApi";
import styles from "../../styles/admin/adminDashboard.module.css";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await getAllCompaniesApi();
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error("Error loading companies:", err);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Owner Dashboard</h1>

      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h3>Total Companies</h3>
          <p className={styles.number}>{companies.length}</p>
        </div>

        <div className={styles.card}>
          <h3>Active Companies</h3>
          <p className={styles.number}>
            {companies.filter((c) => c.isActive).length}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Suspended Companies</h3>
          <p className={styles.number}>
            {companies.filter((c) => !c.isActive).length}
          </p>
        </div>

        <div className={styles.card}>
          <h3>Total Managers</h3>
          <p className={styles.number}>—</p>
        </div>

        <div className={styles.card}>
          <h3>Total Drivers</h3>
          <p className={styles.number}>—</p>
        </div>

        <div className={styles.card}>
          <h3>Total Customers</h3>
          <p className={styles.number}>—</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
