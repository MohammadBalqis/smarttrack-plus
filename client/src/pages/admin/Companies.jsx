import React, { useEffect, useState } from "react";
import { getAllCompaniesApi } from "../../api/adminApi";
import { Link } from "react-router-dom";
import styles from "../../styles/admin/adminDashboard.module.css";

const Companies = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await getAllCompaniesApi();
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <h2>Companies List</h2>
        <Link to="/admin/companies/create" className={styles.primaryBtn}>
          + Create Company
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.email}</td>

                <td>
                  <span
                    className={
                      c.isActive
                        ? styles.badgeActive
                        : styles.badgeInactive
                    }
                  >
                    {c.isActive ? "Active" : "Suspended"}
                  </span>
                </td>

                <td>{new Date(c.createdAt).toLocaleDateString()}</td>

                <td>
                  <Link
                    to={`/admin/companies/${c._id}`}
                    className={styles.linkBtn}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {companies.length === 0 && (
          <p className={styles.empty}>No companies found.</p>
        )}
      </div>
    </div>
  );
};

export default Companies;
