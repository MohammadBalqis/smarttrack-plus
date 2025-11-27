// client/src/pages/manager/ManagerProfile.jsx
import React, { useEffect, useState } from "react";
import {
  getManagerProfileApi,
} from "../../api/managerSettingsApi";
import { getManagerDashboardStatsApi } from "../../api/managerDashboardApi";

import styles from "../../styles/manager/managerProfile.module.css";

const ManagerProfile = () => {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  // Load basic profile (same endpoint as ManagerSettings)
  const loadProfile = async () => {
    try {
      setError("");
      const res = await getManagerProfileApi();
      setUser(res.data.user || null);
    } catch (err) {
      console.error("Error loading manager profile:", err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Load manager dashboard stats (for small KPIs on profile page)
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const res = await getManagerDashboardStatsApi();
      setStats(res.data?.stats || null);
    } catch (err) {
      console.error("Error loading manager stats:", err);
      // no error UI needed here, profile still usable
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const getInitials = (name) => {
    if (!name) return "M";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  if (loading) {
    return <p className={styles.loading}>Loading profile…</p>;
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.error}>Could not load profile data.</p>
      </div>
    );
  }

  const companyName =
    user.company?.name ||
    user.companyName ||
    "Your Company";

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>Profile</h1>
          <p className={styles.subtitle}>
            Overview of your manager account and company context.
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* You can later navigate this button to /manager/settings */}
          <a href="/manager/settings" className={styles.editLink}>
            Go to Settings
          </a>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* Main layout */}
      <div className={styles.layout}>
        {/* LEFT: Profile card */}
        <div className={styles.leftColumn}>
          <div className={styles.profileCard}>
            <div className={styles.profileTop}>
              <div className={styles.avatar}>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className={styles.avatarImg}
                  />
                ) : (
                  <span className={styles.avatarInitials}>
                    {getInitials(user.name)}
                  </span>
                )}
              </div>

              <div className={styles.primaryInfo}>
                <h2 className={styles.name}>{user.name}</h2>
                <p className={styles.role}>Manager</p>
                <div className={styles.badgeRow}>
                  <span className={styles.badgeCompany}>{companyName}</span>
                  <span className={styles.badgeStatus}>
                    {user.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{user.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>
                  {user.phoneNumber || "—"}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Role</span>
                <span className={styles.infoValue}>{user.role}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Account Created</span>
                <span className={styles.infoValue}>
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Last Login</span>
                <span className={styles.infoValue}>
                  {formatDate(user.lastLoginAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Small security card */}
          <div className={styles.securityCard}>
            <h3 className={styles.cardTitle}>Security</h3>
            <p className={styles.securityText}>
              Keep your account secure by using a strong password and
              updating it regularly.
            </p>
            <a href="/manager/settings" className={styles.securityLink}>
              Change password in Settings
            </a>
          </div>
        </div>

        {/* RIGHT: KPIs + company context */}
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Company Overview</h3>
            {statsLoading && !stats ? (
              <p className={styles.smallInfo}>Loading overview…</p>
            ) : !stats ? (
              <p className={styles.smallInfo}>
                No statistics available yet. Start creating trips and orders.
              </p>
            ) : (
              <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Drivers</span>
                  <span className={styles.kpiNumber}>
                    {stats.totalDrivers ?? 0}
                  </span>
                  <span className={styles.kpiHint}>
                    Online: {stats.driversOnline ?? 0}
                  </span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Vehicles</span>
                  <span className={styles.kpiNumber}>
                    {stats.totalVehicles ?? 0}
                  </span>
                  <span className={styles.kpiHint}>
                    In use: {stats.vehiclesInUse ?? 0}
                  </span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Total Trips</span>
                  <span className={styles.kpiNumber}>
                    {stats.totalTrips ?? 0}
                  </span>
                  <span className={styles.kpiHint}>
                    Active: {stats.activeTrips ?? 0}
                  </span>
                </div>
                <div className={styles.kpiCard}>
                  <span className={styles.kpiLabel}>Total Orders</span>
                  <span className={styles.kpiNumber}>
                    {stats.totalOrders ?? 0}
                  </span>
                  <span className={styles.kpiHint}>
                    Pending: {stats.pendingOrders ?? 0}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Activity meta */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Activity Details</h3>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Email verified</span>
                <span className={styles.metaValue}>
                  {user.isEmailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Account status</span>
                <span className={styles.metaValue}>
                  {user.isSuspended ? "Suspended" : "Normal"}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Timezone</span>
                <span className={styles.metaValue}>
                  {user.timezone || "Default"}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Language</span>
                <span className={styles.metaValue}>
                  {user.language || "English"}
                </span>
              </div>
            </div>
            <p className={styles.metaHint}>
              These values are optional and depend on what you store in the
              User model. The page is safe if some fields are missing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;
