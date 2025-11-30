import React, { useEffect, useState } from "react";
import { getActiveCompanyApi } from "../../api/customerCompaniesApi";
import { getCustomerActiveTripsApi } from "../../api/customerTripsApi";
import styles from "../../styles/customer/customerDashboard.module.css";

const CustomerDashboard = () => {
  const [company, setCompany] = useState(null);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res1 = await getActiveCompanyApi();
        if (res1.data.ok) setCompany(res1.data.company);

        const res2 = await getCustomerActiveTripsApi();
        setActiveTrips(res2.data.trips || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.page}>
      {/* -------------------------------- */}
      {/* WELCOME SECTION */}
      {/* -------------------------------- */}
      <div className={styles.welcomeCard}>
        <h1 className={styles.title}>Welcome 👋</h1>
        <p className={styles.subtitle}>
          Manage your orders, track deliveries, and explore products.
        </p>
      </div>

      {/* -------------------------------- */}
      {/* SELECTED COMPANY INFO */}
      {/* -------------------------------- */}
      {company ? (
        <div className={styles.companyCard}>
          <div className={styles.companyHeader}>
            {company.logo ? (
              <img src={company.logo} alt="logo" className={styles.companyLogo} />
            ) : (
              <div className={styles.companyLogoPlaceholder}>
                {company.name[0]}
              </div>
            )}

            <div>
              <h3 className={styles.companyName}>{company.name}</h3>
              {company.businessCategory && (
                <p className={styles.companyCategory}>
                  {company.businessCategory.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          <button
            className={styles.changeCompanyBtn}
            onClick={() => (window.location.href = "/customer/select-company")}
          >
            Change Company
          </button>
        </div>
      ) : (
        <div className={styles.noCompanyBox}>
          <p>No company selected yet.</p>
          <button
            className={styles.primaryBtn}
            onClick={() => (window.location.href = "/customer/select-company")}
          >
            Select a Company
          </button>
        </div>
      )}

      {/* -------------------------------- */}
      {/* ACTIVE ORDERS */}
      {/* -------------------------------- */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Deliveries</h2>

        {activeTrips.length === 0 ? (
          <p className={styles.info}>No active orders right now.</p>
        ) : (
          <div className={styles.tripList}>
            {activeTrips.map((t) => (
              <div key={t._id} className={styles.tripCard}>
                <h4 className={styles.tripTitle}>
                  Order #{t._id.slice(-5).toUpperCase()}
                </h4>

                <p className={styles.tripStatus}>{t.status}</p>

                <button
                  className={styles.trackBtn}
                  onClick={() =>
                    (window.location.href = `/customer/trips?trip=${t._id}`)
                  }
                >
                  Track Order →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -------------------------------- */}
      {/* QUICK ACTIONS */}
      {/* -------------------------------- */}
      <div className={styles.actionsGrid}>
        <button
          className={styles.actionCard}
          onClick={() => (window.location.href = "/customer/products")}
        >
          📦 Browse Products
        </button>

        <button
          className={styles.actionCard}
          onClick={() => (window.location.href = "/customer/trips")}
        >
          🚚 Track Your Trips
        </button>

        <button
          className={styles.actionCard}
          onClick={() => (window.location.href = "/customer/payments")}
        >
          💳 Payment History
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
