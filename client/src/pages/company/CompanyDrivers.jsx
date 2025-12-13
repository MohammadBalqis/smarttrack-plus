// client/src/pages/company/CompanyDrivers.jsx
import React, { useEffect, useState } from "react";
import { getCompanyDriversApi } from "../../api/companyDriversApi";
import styles from "../../styles/company/companyDrivers.module.css";

const CompanyDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadDrivers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCompanyDriversApi();
      setDrivers(res.data.drivers || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const getVerificationLabel = (d) => {
    if (d.driverVerificationStatus === "verified") return "Verified";
    if (d.driverVerificationStatus === "rejected") return "Rejected";
    return "Pending";
  };

  const getVerificationClass = (d) => {
    if (d.driverVerificationStatus === "verified") return styles.verified;
    if (d.driverVerificationStatus === "rejected") return styles.rejected;
    return styles.pending;
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1>Company Drivers</h1>
        <p>Driver profiles and account status across all branches.</p>
      </div>

      {loading && <p>Loading drivers…</p>}
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.grid}>
        {drivers.map((d) => (
          <div key={d._id} className={styles.card}>
            {/* TOP */}
            <div className={styles.top}>
              <img
                src={d.profileImage || "/placeholder-user.png"}
                alt={d.name}
                className={styles.avatar}
              />

              <span className={getVerificationClass(d)}>
                {getVerificationLabel(d)}
              </span>
            </div>

            {/* INFO */}
            <h3>{d.name}</h3>
            <p className={styles.phone}>
              {d.phone || d.phoneNumber || "—"}
            </p>
            <p className={styles.email}>{d.email || "—"}</p>

            <div className={styles.section}>
              <strong>Branch:</strong>{" "}
              {d.shopId
                ? `${d.shopId.name}${
                    d.shopId.city ? ` (${d.shopId.city})` : ""
                  }`
                : "—"}
            </div>

            <div className={styles.section}>
              <strong>Status:</strong>{" "}
              {d.isActive !== false ? "Active" : "Suspended"}
            </div>
          </div>
        ))}
      </div>

      {!loading && drivers.length === 0 && (
        <p className={styles.empty}>No drivers found.</p>
      )}
    </div>
  );
};

export default CompanyDrivers;
