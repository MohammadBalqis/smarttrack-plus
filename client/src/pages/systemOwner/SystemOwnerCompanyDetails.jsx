import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/apiClient";
import styles from "../../styles/systemOwner/ownerCompanyDetails.module.css";

const OwnerCompanyDetails = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");

  const loadCompany = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/owner/company/${companyId}`);
      setCompany(res.data.company);
    } catch (err) {
      console.error(err);
      setError("Failed to load company details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  if (loading) {
    return <div className={styles.loading}>Loading company...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!company) {
    return <div className={styles.error}>Company not found.</div>;
  }

  return (
    <div className={styles.page}>
      {/* ================= HEADER ================= */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/owner/companies")}
        >
          ← Back to Companies
        </button>

        <div>
          <h1 className={styles.title}>{company.name}</h1>
          <p className={styles.subtitle}>
            Created on {new Date(company.createdAt).toLocaleDateString()}
          </p>
        </div>

        <span
          className={
            company.status === "Suspended"
              ? styles.statusSuspended
              : styles.statusActive
          }
        >
          {company.status}
        </span>
      </div>

      {/* ================= GRID ================= */}
      <div className={styles.grid}>
        {/* Subscription */}
        <div className={styles.card}>
          <h3>Subscription</h3>
          <p>
            <strong>Plan:</strong> {company.subscriptionPlan}
          </p>
          <p>
            <strong>Price:</strong> ${company.subscriptionPrice} / month
          </p>
          <p>
            <strong>Drivers:</strong>{" "}
            {company.totalDrivers} / {company.maxDrivers}
          </p>

          {company.isPastDue && (
            <span className={styles.badgeLate}>Payment Late</span>
          )}
        </div>

        {/* Performance */}
        <div className={styles.card}>
          <h3>Today Performance</h3>
          <p>
            <strong>Trips:</strong> {company.tripsToday}
          </p>
          <p>
            <strong>Revenue:</strong> ${company.totalRevenue}
          </p>
          <p>
            <strong>Active Drivers:</strong> {company.activeDrivers}
          </p>
        </div>

        {/* Admin Actions */}
        <div className={styles.card}>
          <h3>Admin Actions</h3>

          <button
            className={styles.primaryBtn}
            onClick={() => alert("Suspend logic later")}
          >
            Suspend Company
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={() => alert("View billing later")}
          >
            View Billing History
          </button>

          <button
            className={styles.secondaryBtn}
            onClick={() => alert("View activity later")}
          >
            View Activity Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerCompanyDetails;
