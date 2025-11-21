// client/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { getAllCompaniesApi } from "../../api/adminApi";
import { getSuperadminStatsApi } from "../../api/adminStatsApi";
import styles from "../../styles/admin/adminDashboard.module.css";

const AdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Load companies for table / any extra usage
      const companiesRes = await getAllCompaniesApi();
      setCompanies(companiesRes.data.companies || []);

      // Load REAL superadmin stats
      const statsRes = await getSuperadminStatsApi();
      setStats(statsRes.data.stats || {});
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>System Owner Dashboard</h1>

      <div className={styles.kpiGrid}>
        {/* Total Companies */}
        <div className={styles.card}>
          <h3>Total Companies</h3>
          <p className={styles.number}>{stats?.totalCompanies || 0}</p>
        </div>

        {/* Active Companies */}
        <div className={styles.card}>
          <h3>Active Companies</h3>
          <p className={styles.number}>{stats?.activeCompanies || 0}</p>
        </div>

        {/* Suspended Companies */}
        <div className={styles.card}>
          <h3>Suspended Companies</h3>
          <p className={styles.number}>{stats?.suspendedCompanies || 0}</p>
        </div>

        {/* Total Managers */}
        <div className={styles.card}>
          <h3>Total Managers</h3>
          <p className={styles.number}>{stats?.totalManagers || 0}</p>
        </div>

        {/* Total Drivers */}
        <div className={styles.card}>
          <h3>Total Drivers</h3>
          <p className={styles.number}>{stats?.totalDrivers || 0}</p>
        </div>

        {/* Total Customers */}
        <div className={styles.card}>
          <h3>Total Customers</h3>
          <p className={styles.number}>{stats?.totalCustomers || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
